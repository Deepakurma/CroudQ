import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "../../db";
import {
    properties,
    propertyFacilities,
    propertyRoomTypes,
    residents,
    rooms
} from "../../db/schema";
import {
    cancelPropertyDeletion,
    PROPERTY_DELETION_GRACE_DAYS,
    schedulePropertyDeletion,
} from "../../services/property-deletion";
import { roleGuardService } from "../../services/roleGuardService";
import { deleteS3Object, resolveManagedS3KeyForProperty } from "../../services/s3-sender";
import { propertyProcedure, protectedProcedure, router } from "../../server/trpc";
import {
    addRoomSchema,
    createPropertySchema,
    getRoomsSchema,
    listPropertiesSchema,
    renumberFloorRoomsSchema,
    updateInchargeSchema,
    updatePropertySchema,
    updateRoomStructureSchema,
    updateRoomSchema,
    updateRoomsBulkSchema,
} from "./dto";

type RoomInsert = typeof rooms.$inferInsert;
type RoomUpdateData = Partial<
    Pick<RoomInsert, "typeId" | "customRentAmount" | "roomNumber" | "ac">
>;

export const propertyRouter = router({
    create: protectedProcedure
        .input(createPropertySchema)
        .mutation(async ({ input, ctx }) => {
            const createdProperty = await db.transaction(async (tx) => {
                await roleGuardService.assertCanBeLandlord(tx, ctx.user.id);

                const [newProperty] = await tx
                    .insert(properties)
                    .values({
                        id: crypto.randomUUID(),
                        userId: ctx.user.id,
                        name: input.propertyName,
                        inchargeName: input.inchargeName,
                        inchargePhone: input.inchargePhone,
                        type: input.type,
                        addressLine1: input.address1,
                        city: input.city,
                        state: input.state,
                        pincode: input.pincode,
                        area: input.area,
                        mapsLink: input.mapsLink || "",
                        landmarks: input.landmarks,
                        floors: parseInt(input.floors, 10) || 0,
                        includeGroundFloor: input.includeGroundFloor,
                        rules: input.rules,
                        photos: input.photos,
                        description: "",
                    })
                    .returning();

                await tx.insert(propertyFacilities).values({
                    id: crypto.randomUUID(),
                    propertyId: newProperty.id,
                    ...input.facilities,
                });

                const roomTypeMap = new Map<string, string>();
                for (const typeName of input.roomTypes) {
                    const rent = parseInt(input.rents[typeName] || "0", 10);
                    const [newType] = await tx
                        .insert(propertyRoomTypes)
                        .values({
                            id: crypto.randomUUID(),
                            propertyId: newProperty.id,
                            name: typeName,
                            rentAmount: rent,
                            maxOccupancy: parseInt(typeName, 10) || 1,
                        })
                        .returning();
                    roomTypeMap.set(typeName, newType.id);
                }

                const roomsToInsert: RoomInsert[] = [];
                const numFloors = parseInt(input.floors, 10) || 0;
                const singleTypeId =
                    roomTypeMap.get("Single") || roomTypeMap.values().next().value;

                for (let i = 0; i < numFloors; i++) {
                    const roomsCount = parseInt(input.roomsPerFloor[i.toString()] || "0", 10);
                    if (roomsCount <= 0) continue;

                    let displayFloorNum = i + 1;
                    let isGround = false;

                    if (input.includeGroundFloor) {
                        if (i === 0) {
                            isGround = true;
                            displayFloorNum = 0;
                        } else {
                            displayFloorNum = i;
                        }
                    } else {
                        displayFloorNum = i + 1;
                    }

                    const prefix = isGround ? "G" : displayFloorNum.toString();

                    for (let r = 1; r <= roomsCount; r++) {
                        const roomNumber = `${prefix}${r.toString().padStart(2, "0")}`;

                        roomsToInsert.push({
                            id: crypto.randomUUID(),
                            propertyId: newProperty.id,
                            floorNumber: displayFloorNum,
                            roomNumber,
                            typeId: singleTypeId,
                            status: "vacant",
                            customRentAmount: null,
                        });
                    }
                }

                if (roomsToInsert.length > 0) {
                    await tx.insert(rooms).values(roomsToInsert);
                }

                return newProperty;
            });

            return { success: true, propertyId: createdProperty.id };
        }),

    updateRoom: propertyProcedure
        .input(updateRoomSchema)
        .mutation(async ({ input, ctx }) => {
            // Allow verifying room belongs to property
            const room = await db.query.rooms.findFirst({
                where: (r, { eq, and }) =>
                    and(eq(r.id, input.roomId), eq(r.propertyId, ctx.propertyId)),
                with: {
                    property: true,
                },
            });

            if (!room) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Room not found or access denied",
                });
            }

            let typeId = room.typeId;

            if (input.type) {
                const typeRecord = await db.query.propertyRoomTypes.findFirst({
                    where: (types, { eq, and }) =>
                        and(
                            eq(types.propertyId, ctx.propertyId),
                            eq(types.name, input.type!),
                        ),
                });

                if (typeRecord) {
                    typeId = typeRecord.id;
                } else {
                    // Create new type on the fly
                    const match = input.type!.match(/(\d+)/);
                    const occupancy = match ? parseInt(match[1]) : 1;
                    const defaultRent = input.price ? parseInt(input.price) : 0;

                    const [newType] = await db
                        .insert(propertyRoomTypes)
                        .values({
                            id: crypto.randomUUID(),
                            propertyId: ctx.propertyId,
                            name: input.type!,
                            rentAmount: defaultRent,
                            maxOccupancy: occupancy,
                        })
                        .returning();

                    typeId = newType.id;
                }
            }

            const updateData: RoomUpdateData = {};
            if (typeId) updateData.typeId = typeId;

            if (input.price) {
                const parsedPrice = parseInt(input.price);
                if (!isNaN(parsedPrice)) {
                    updateData.customRentAmount = parsedPrice;
                }
            }

            if (input.roomNumber) {
                const existing = await db.query.rooms.findFirst({
                    where: (r, { eq, and, ne }) =>
                        and(
                            eq(r.propertyId, ctx.propertyId),
                            eq(r.roomNumber, input.roomNumber!),
                            ne(r.id, input.roomId),
                        ),
                });

                if (existing) {
                    throw new TRPCError({
                        code: "CONFLICT",
                        message: `Room number ${input.roomNumber} already exists.`,
                    });
                }
                updateData.roomNumber = input.roomNumber;
            }

            if (typeof input.isAc === "boolean") {
                updateData.ac = input.isAc;
            }

            const [updated] = await db
                .update(rooms)
                .set(updateData)
                .where(and(eq(rooms.id, input.roomId), eq(rooms.propertyId, ctx.propertyId)))
                .returning();

            if (!updated) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Room not found or access denied",
                });
            }

            return updated;
        }),

    updateRoomsBulk: propertyProcedure
        .input(updateRoomsBulkSchema)
        .mutation(async ({ input, ctx }) => {
            return await db.transaction(async (tx) => {
                const targetRooms = await tx.query.rooms.findMany({
                    where: (r, { and, eq, inArray }) =>
                        and(eq(r.propertyId, ctx.propertyId), inArray(r.id, input.roomIds)),
                });

                if (targetRooms.length !== input.roomIds.length) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "One or more rooms not found or access denied",
                    });
                }

                let typeId: string | null = null;
                if (input.type) {
                    const existingType = await tx.query.propertyRoomTypes.findFirst({
                        where: (types, { and, eq }) =>
                            and(eq(types.propertyId, ctx.propertyId), eq(types.name, input.type!)),
                    });

                    if (existingType) {
                        typeId = existingType.id;
                    } else {
                        const match = input.type.match(/(\d+)/);
                        const occupancy = match ? parseInt(match[1]) : 1;
                        const defaultRent = input.price ? parseInt(input.price) : 0;
                        const [createdType] = await tx
                            .insert(propertyRoomTypes)
                            .values({
                                id: crypto.randomUUID(),
                                propertyId: ctx.propertyId,
                                name: input.type,
                                rentAmount: defaultRent,
                                maxOccupancy: occupancy,
                            })
                            .returning();
                        typeId = createdType.id;
                    }
                }

                const updateData: RoomUpdateData = {};
                if (typeId) updateData.typeId = typeId;
                if (typeof input.isAc === "boolean") updateData.ac = input.isAc;
                if (input.price) {
                    const parsedPrice = parseInt(input.price);
                    if (!isNaN(parsedPrice)) updateData.customRentAmount = parsedPrice;
                }

                if (Object.keys(updateData).length === 0) {
                    return { success: true, updatedCount: 0 };
                }

                await tx
                    .update(rooms)
                    .set(updateData)
                    .where(
                        and(
                            eq(rooms.propertyId, ctx.propertyId),
                            inArray(rooms.id, input.roomIds),
                        ),
                    );

                return { success: true, updatedCount: input.roomIds.length };
            });
        }),

    getRooms: propertyProcedure
        .input(getRoomsSchema)
        .query(async ({ ctx, input }) => {
            const propertyId = ctx.propertyId;
            const searchQuery = input?.q?.trim();
            const statusFilter = input?.status ?? "all";
            const limit = input?.limit ?? 300;

            const filters = [eq(rooms.propertyId, propertyId)];
            if (searchQuery) {
                filters.push(
                    or(
                        sql`(
                            setweight(to_tsvector('english', coalesce(${rooms.roomNumber}, '')), 'A')
                        ) @@ websearch_to_tsquery('english', ${searchQuery})`,
                        sql`(
                            setweight(to_tsvector('english', coalesce(${propertyRoomTypes.name}, '')), 'A')
                        ) @@ websearch_to_tsquery('english', ${searchQuery})`,
                        sql`to_tsvector('simple', coalesce(cast(${rooms.floorNumber} as text), ''))
                            @@ websearch_to_tsquery('simple', ${searchQuery})`,
                    )!,
                );
            }

            const occupancyCountExpr = sql<number>`count(${residents.id})`;
            const roomCapacityExpr = sql<number>`coalesce(${propertyRoomTypes.maxOccupancy}, 1)`;
            const statusHaving =
                statusFilter === "available"
                    ? sql`${occupancyCountExpr} < ${roomCapacityExpr}`
                    : statusFilter === "occupied"
                        ? sql`${occupancyCountExpr} >= ${roomCapacityExpr}`
                        : undefined;

            const fetchedRooms = await db
                .select({
                    id: rooms.id,
                    roomNumber: rooms.roomNumber,
                    floorNumber: rooms.floorNumber,
                    status: rooms.status,
                    customRent: rooms.customRentAmount,
                    ac: rooms.ac,
                    typeName: propertyRoomTypes.name,
                    typeRentAmount: propertyRoomTypes.rentAmount,
                    typeMaxOccupancy: propertyRoomTypes.maxOccupancy,
                    currentOccupancy: occupancyCountExpr,
                })
                .from(rooms)
                .leftJoin(
                    propertyRoomTypes,
                    and(
                        eq(rooms.typeId, propertyRoomTypes.id),
                        eq(propertyRoomTypes.propertyId, propertyId),
                    ),
                )
                .leftJoin(
                    residents,
                    and(
                        eq(residents.roomId, rooms.id),
                        eq(residents.propertyId, propertyId),
                        eq(residents.status, "active"),
                    ),
                )
                .where(and(...filters))
                .groupBy(
                    rooms.id,
                    rooms.roomNumber,
                    rooms.floorNumber,
                    rooms.status,
                    rooms.customRentAmount,
                    rooms.ac,
                    propertyRoomTypes.name,
                    propertyRoomTypes.rentAmount,
                    propertyRoomTypes.maxOccupancy,
                )
                .having(statusHaving)
                .orderBy(rooms.floorNumber, rooms.roomNumber)
                .limit(limit);

        const fetchedFacilities = await db
            .select()
            .from(propertyFacilities)
            .where(eq(propertyFacilities.propertyId, propertyId))
            .limit(1);

        const isAc = fetchedFacilities[0]?.ac || false;

            const roomPayload = fetchedRooms.map((r) => {
                const rent = r.customRent ?? r.typeRentAmount ?? 0;

                let floorLabel = `${r.floorNumber}th Floor`;
                if (r.floorNumber === 0) floorLabel = "Ground";
                if (r.floorNumber === 1) floorLabel = "1st Floor";
                if (r.floorNumber === 2) floorLabel = "2nd Floor";
                if (r.floorNumber === 3) floorLabel = "3rd Floor";

                return {
                    id: r.id,
                    roomNumber: r.roomNumber,
                    floor: floorLabel,
                    type: r.typeName || "Unknown",
                    isAc: r.ac ?? isAc,
                    price: rent.toString(),
                    totalCapacity: r.typeMaxOccupancy || 1,
                    currentOccupancy: r.currentOccupancy || 0,
                };
            });

            return roomPayload;
        }),

    getRoomTypes: propertyProcedure.query(async ({ ctx }) => {
        return await db
            .select()
            .from(propertyRoomTypes)
            .where(eq(propertyRoomTypes.propertyId, ctx.propertyId));
    }),

    renumberFloorRooms: propertyProcedure
        .input(renumberFloorRoomsSchema)
        .mutation(async ({ input, ctx }) => {
            return await db.transaction(async (tx) => {
                const existingRooms = await tx
                    .select()
                    .from(rooms)
                    .where(
                        and(
                            eq(rooms.propertyId, ctx.propertyId),
                            eq(rooms.floorNumber, input.floorNumber),
                        ),
                    );

                if (existingRooms.length === 0) {
                    return { success: false, message: "No rooms found on this floor" };
                }

                existingRooms.sort((a, b) =>
                    a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }),
                );

                const roomNumberUpdates: Array<{ id: string; roomNumber: string }> = [];
                for (let i = 0; i < existingRooms.length; i++) {
                    const room = existingRooms[i];
                    const newNum = input.startNumber + i;

                    const numStr = input.padding
                        ? newNum.toString().padStart(input.padding, "0")
                        : newNum.toString();
                    const newRoomNumber = `${input.prefix}${numStr}`;
                    roomNumberUpdates.push({ id: room.id, roomNumber: newRoomNumber });
                }

                const updatesSql = sql.join(
                    roomNumberUpdates.map((update) =>
                        sql`WHEN ${rooms.id} = ${update.id} THEN ${update.roomNumber}`,
                    ),
                    sql` `,
                );

                await tx
                    .update(rooms)
                    .set({
                        roomNumber: sql`CASE ${updatesSql} ELSE ${rooms.roomNumber} END` as unknown as string,
                    })
                    .where(
                        and(
                            eq(rooms.propertyId, ctx.propertyId),
                            inArray(
                                rooms.id,
                                roomNumberUpdates.map((item) => item.id),
                            ),
                        ),
                    );

                return { success: true };
            });
        }),

    addRoom: propertyProcedure
        .input(addRoomSchema)
        .mutation(async ({ input, ctx }) => {
            const existingRoom = await db
                .select()
                .from(rooms)
                .where(
                    and(
                        eq(rooms.propertyId, ctx.propertyId),
                        eq(rooms.roomNumber, input.roomNumber),
                    ),
                );

            if (existingRoom.length > 0) {
                const onSameFloor = existingRoom.find(
                    (r) => r.floorNumber === input.floorNumber,
                );
                if (onSameFloor) {
                    throw new TRPCError({
                        code: "CONFLICT",
                        message: "Room number already exists on this floor",
                    });
                }
            }

            let typeId: string | null = null;
            const typeRecord = await db
                .select()
                .from(propertyRoomTypes)
                .where(
                    and(
                        eq(propertyRoomTypes.propertyId, ctx.propertyId),
                        eq(propertyRoomTypes.name, input.type),
                    ),
                )
                .limit(1);

            if (typeRecord.length > 0) {
                typeId = typeRecord[0].id;
            } else {
                const rent = parseInt(input.price) || 0;
                const match = input.type.match(/(\d+)/);
                const occupancy = match ? parseInt(match[1]) : 1;

                const [newType] = await db
                    .insert(propertyRoomTypes)
                    .values({
                        id: crypto.randomUUID(),
                        propertyId: ctx.propertyId,
                        name: input.type,
                        rentAmount: rent,
                        maxOccupancy: occupancy,
                    })
                    .returning();
                typeId = newType.id;
            }

            try {
                const [created] = await db.insert(rooms).values({
                    id: crypto.randomUUID(),
                    propertyId: ctx.propertyId,
                    floorNumber: input.floorNumber,
                    roomNumber: input.roomNumber,
                    typeId: typeId,
                    status: "vacant",
                    customRentAmount: input.price ? parseInt(input.price) : null,
                    ac: input.isAc,
                }).returning();

                return created;
            } catch (error: unknown) {
                const errorCode =
                    typeof error === "object" && error !== null && "code" in error
                        ? (error as { code?: string }).code
                        : undefined;
                if (errorCode === "23505") {
                    throw new TRPCError({
                        code: "CONFLICT",
                        message: "Room number already exists in this property",
                    });
                }
                throw error;
            }
        }),

    getPropertyDetails: propertyProcedure.query(async ({ ctx }) => {
        const propertyId = ctx.propertyId;
        const property = await db.query.properties.findFirst({
            where: eq(properties.id, propertyId),
        });

        if (!property) return null;

        const facilities = await db
            .select()
            .from(propertyFacilities)
            .where(eq(propertyFacilities.propertyId, propertyId))
            .limit(1);

        const roomTypes = await db
            .select()
            .from(propertyRoomTypes)
            .where(eq(propertyRoomTypes.propertyId, propertyId));

        const allRooms = await db
            .select({
                floorNumber: rooms.floorNumber,
                typeId: rooms.typeId,
            })
            .from(rooms)
            .where(eq(rooms.propertyId, propertyId));

        const roomsPerFloor: Record<string, string> = {};
        for (const r of allRooms) {
            const floorKey = r.floorNumber.toString();
            roomsPerFloor[floorKey] = (
                parseInt(roomsPerFloor[floorKey] || "0") + 1
            ).toString();
        }

        const roomTypeMap = new Map<string, number>();
        const uniqueRoomTypes = new Set<string>();
        const rents: Record<string, string> = {};

        for (const rt of roomTypes) {
            rents[rt.name] = (rt.rentAmount || 0).toString();
            uniqueRoomTypes.add(rt.name);
            roomTypeMap.set(rt.id, rt.maxOccupancy || 1);
        }

        const roomTypesList = Array.from(uniqueRoomTypes);

        const totalCapacity = allRooms.reduce((sum, r) => {
            if (r.typeId && roomTypeMap.has(r.typeId)) {
                return sum + (roomTypeMap.get(r.typeId) || 1);
            }
            return sum + 1;
        }, 0);

        return {
            ...property,
            facilities: facilities[0] || {},
            roomsPerFloor,
            roomTypes: roomTypesList,
            rents,
            totalCapacity,
        };
    }),

    getAllProperties: protectedProcedure
        .input(listPropertiesSchema)
        .query(async ({ ctx, input }) => {
            const limit = input?.limit ?? 100;
            return await db
                .select({
                    id: properties.id,
                    name: properties.name,
                    isFrozen: properties.isFrozen,
                    freezeReason: properties.freezeReason,
                    deletionScheduledFor: properties.deletionScheduledFor,
                })
                .from(properties)
                .where(eq(properties.userId, ctx.user.id))
                .orderBy(desc(properties.createdAt))
                .limit(limit);
        }),

    getDashboardStats: propertyProcedure.query(async ({ ctx }) => {
        const propertyId = ctx.propertyId;

        const allRooms = await db
            .select({
                id: rooms.id,
                typeId: rooms.typeId,
            })
            .from(rooms)
            .where(eq(rooms.propertyId, propertyId));

        const roomTypes = await db
            .select({
                id: propertyRoomTypes.id,
                maxOccupancy: propertyRoomTypes.maxOccupancy,
            })
            .from(propertyRoomTypes)
            .where(eq(propertyRoomTypes.propertyId, propertyId));

        const roomTypeMap = new Map<string, number>();
        for (const rt of roomTypes) {
            roomTypeMap.set(rt.id, rt.maxOccupancy || 1);
        }

        const totalCapacity = allRooms.reduce((sum, r) => {
            if (r.typeId && roomTypeMap.has(r.typeId)) {
                return sum + (roomTypeMap.get(r.typeId) || 1);
            }
            return sum + 1;
        }, 0);

        const activeResidents = await db
            .select({
                roomId: residents.roomId,
            })
            .from(residents)
            .where(
                and(
                    eq(residents.propertyId, propertyId),
                    eq(residents.status, "active"),
                ),
            );

        const totalResidents = activeResidents.length;

        const roomOccupancyMap = new Map<string, number>();
        for (const r of activeResidents) {
            roomOccupancyMap.set(r.roomId, (roomOccupancyMap.get(r.roomId) || 0) + 1);
        }

        let vacantRooms = 0;

        for (const r of allRooms) {
            const currentOcc = roomOccupancyMap.get(r.id) || 0;
            if (currentOcc === 0) {
                vacantRooms++;
            }
        }

        const totalRooms = allRooms.length;
        const occupiedRooms = totalRooms - vacantRooms;
        const availableRooms = vacantRooms;

        const occupiedBeds = totalResidents;
        const emptyBeds = totalCapacity - totalResidents;

        const occupancyRate =
            totalCapacity > 0
                ? Math.round((totalResidents / totalCapacity) * 100)
                : 0;

        return {
            totalResidents,
            totalCapacity,
            occupancyRate,
            availableRooms,
            occupiedRooms,
            totalRooms,
            occupiedBeds,
            emptyBeds,
        };
    }),

    update: propertyProcedure
        .input(updatePropertySchema)
        .mutation(async ({ input, ctx }) => {
            const keysToDelete = await db.transaction(async (tx) => {
                const currentProperty = await tx.query.properties.findFirst({
                    where: eq(properties.id, ctx.propertyId),
                });
                if (!currentProperty) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Property not found.",
                    });
                }

                const previousKeys = new Set(
                    (currentProperty.photos || [])
                        .map((photo) => resolveManagedS3KeyForProperty(photo, ctx.propertyId))
                        .filter((value): value is string => Boolean(value)),
                );
                const nextKeys = new Set(
                    input.photos
                        .map((photo) => resolveManagedS3KeyForProperty(photo, ctx.propertyId))
                        .filter((value): value is string => Boolean(value)),
                );

                await tx
                    .update(properties)
                    .set({
                        name: input.propertyName,
                        inchargeName: input.inchargeName,
                        inchargePhone: input.inchargePhone,
                        type: input.type,
                        addressLine1: input.address1,
                        city: input.city,
                        state: input.state,
                        pincode: input.pincode,
                        area: input.area,
                        mapsLink: input.mapsLink || "",
                        landmarks: input.landmarks,
                        rules: input.rules,
                        photos: input.photos,
                    })
                    .where(eq(properties.id, ctx.propertyId));

                await tx
                    .update(propertyFacilities)
                    .set({ ...input.facilities })
                    .where(eq(propertyFacilities.propertyId, ctx.propertyId));

                const existingTypes = await tx
                    .select({
                        id: propertyRoomTypes.id,
                        name: propertyRoomTypes.name,
                    })
                    .from(propertyRoomTypes)
                    .where(eq(propertyRoomTypes.propertyId, ctx.propertyId));

                const selectedTypeNames = Array.from(new Set(input.roomTypes));
                const existingTypeNames = new Set(existingTypes.map((type) => type.name));
                const selectedTypeNameSet = new Set(selectedTypeNames);

                const typesToAdd = selectedTypeNames.filter((name) => !existingTypeNames.has(name));
                const typesToRemove = existingTypes.filter(
                    (existing) => !selectedTypeNameSet.has(existing.name),
                );

                if (typesToRemove.length > 0) {
                    const idsToRemove = typesToRemove.map((type) => type.id);
                    const roomsUsingRemovedTypes = await tx
                        .select({
                            id: rooms.id,
                        })
                        .from(rooms)
                        .where(
                            and(
                                eq(rooms.propertyId, ctx.propertyId),
                                inArray(rooms.typeId, idsToRemove),
                            ),
                        )
                        .limit(1);

                    if (roomsUsingRemovedTypes.length > 0) {
                        throw new TRPCError({
                            code: "BAD_REQUEST",
                            message:
                                "Cannot remove room types that are currently assigned to rooms.",
                        });
                    }

                    await tx
                        .delete(propertyRoomTypes)
                        .where(
                            and(
                                eq(propertyRoomTypes.propertyId, ctx.propertyId),
                                inArray(propertyRoomTypes.id, idsToRemove),
                            ),
                        );
                }

                for (const typeName of typesToAdd) {
                    const rent = parseInt(input.rents[typeName] || "0", 10) || 0;
                    const match = typeName.match(/(\d+)/);
                    const occupancy = match ? parseInt(match[1], 10) : 1;

                    await tx.insert(propertyRoomTypes).values({
                        id: crypto.randomUUID(),
                        propertyId: ctx.propertyId,
                        name: typeName,
                        rentAmount: rent,
                        maxOccupancy: occupancy,
                    });
                }

                for (const typeName of selectedTypeNames) {
                    const rent = parseInt(input.rents[typeName] || "0", 10) || 0;
                    await tx
                        .update(propertyRoomTypes)
                        .set({ rentAmount: rent })
                        .where(
                            and(
                                eq(propertyRoomTypes.propertyId, ctx.propertyId),
                                eq(propertyRoomTypes.name, typeName),
                            ),
                        );
                }

                return Array.from(previousKeys).filter((key) => !nextKeys.has(key));
            });

            if (keysToDelete.length > 0) {
                const deleteResults = await Promise.allSettled(
                    keysToDelete.map((key) => deleteS3Object(key)),
                );
                deleteResults.forEach((result, index) => {
                    if (result.status === "rejected") {
                        console.error("Failed to delete S3 object after property update", {
                            key: keysToDelete[index],
                            error: result.reason,
                        });
                    }
                });
            }

            return { success: true };
        }),

    validateRoomStructure: propertyProcedure
        .input(updateRoomStructureSchema)
        .mutation(async ({ input, ctx }) => {
            const numFloors = parseInt(input.floors, 10) || 0;
            const parseRoomSlot = (roomNumber: string) => {
                const match = roomNumber.match(/(\d+)$/);
                return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
            };

            const floorLabel = (index: number) => {
                if (input.includeGroundFloor) {
                    if (index === 0) return "Ground Floor";
                    if (index === 1) return "1st Floor";
                    if (index === 2) return "2nd Floor";
                    if (index === 3) return "3rd Floor";
                    return `${index}th Floor`;
                }
                const floorNum = index + 1;
                if (floorNum === 1) return "1st Floor";
                if (floorNum === 2) return "2nd Floor";
                if (floorNum === 3) return "3rd Floor";
                return `${floorNum}th Floor`;
            };

            const floorNumberFromIndex = (index: number) => {
                if (input.includeGroundFloor) return index === 0 ? 0 : index;
                return index + 1;
            };

            const [property] = await db
                .select({
                    id: properties.id,
                })
                .from(properties)
                .where(eq(properties.id, ctx.propertyId))
                .limit(1);

            if (!property) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Property not found or access denied",
                });
            }

            const allRooms = await db
                .select({
                    id: rooms.id,
                    floorNumber: rooms.floorNumber,
                    roomNumber: rooms.roomNumber,
                    status: rooms.status,
                })
                .from(rooms)
                .where(eq(rooms.propertyId, ctx.propertyId));

            const activeResidents = await db
                .select({
                    roomId: residents.roomId,
                })
                .from(residents)
                .where(
                    and(
                        eq(residents.propertyId, ctx.propertyId),
                        eq(residents.status, "active"),
                    ),
                );
            const activeResidentRoomIds = new Set(
                activeResidents.map((resident) => resident.roomId),
            );

            const roomsByFloor = new Map<number, typeof allRooms>();
            for (const room of allRooms) {
                const existing = roomsByFloor.get(room.floorNumber) || [];
                existing.push(room);
                roomsByFloor.set(room.floorNumber, existing);
            }

            for (let i = 0; i < numFloors; i++) {
                const floorNumber = floorNumberFromIndex(i);
                const desiredCountRaw = input.roomsPerFloor[i.toString()];
                const desiredCount = parseInt(desiredCountRaw || "0", 10);
                if (!desiredCountRaw || !Number.isFinite(desiredCount) || desiredCount < 1) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: `At least one room is required for ${floorLabel(i)}.`,
                    });
                }
                if (desiredCount > 50) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: `Room count on ${floorLabel(i)} cannot exceed 50.`,
                    });
                }

                const existingRooms = [...(roomsByFloor.get(floorNumber) || [])].sort((a, b) => {
                    const slotDiff = parseRoomSlot(a.roomNumber) - parseRoomSlot(b.roomNumber);
                    if (slotDiff !== 0) return slotDiff;
                    return a.roomNumber.localeCompare(b.roomNumber, undefined, {
                        numeric: true,
                        sensitivity: "base",
                    });
                });

                if (desiredCount < existingRooms.length) {
                    const removableCandidates = existingRooms.slice(desiredCount);
                    const blockedRoom = removableCandidates.find(
                        (room) =>
                            room.status !== "vacant" || activeResidentRoomIds.has(room.id),
                    );
                    if (blockedRoom) {
                        throw new TRPCError({
                            code: "BAD_REQUEST",
                            message: `Cannot reduce rooms on ${floorLabel(i)} because higher room slots are occupied.`,
                        });
                    }
                }
            }

            const incomingFloorNumbers = new Set<number>();
            for (let i = 0; i < numFloors; i++) {
                incomingFloorNumbers.add(floorNumberFromIndex(i));
            }

            for (const room of allRooms) {
                if (incomingFloorNumbers.has(room.floorNumber)) continue;
                if (room.status !== "vacant" || activeResidentRoomIds.has(room.id)) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "Cannot remove floors with occupied rooms.",
                    });
                }
            }

            return { success: true };
        }),

    updateRoomStructure: propertyProcedure
        .input(updateRoomStructureSchema)
        .mutation(async ({ input, ctx }) => {
            const numFloors = parseInt(input.floors, 10) || 0;
            const parseRoomSlot = (roomNumber: string) => {
                const match = roomNumber.match(/(\d+)$/);
                return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
            };

            const floorLabel = (index: number) => {
                if (input.includeGroundFloor) {
                    if (index === 0) return "Ground Floor";
                    if (index === 1) return "1st Floor";
                    if (index === 2) return "2nd Floor";
                    if (index === 3) return "3rd Floor";
                    return `${index}th Floor`;
                }
                const floorNum = index + 1;
                if (floorNum === 1) return "1st Floor";
                if (floorNum === 2) return "2nd Floor";
                if (floorNum === 3) return "3rd Floor";
                return `${floorNum}th Floor`;
            };

            const floorNumberFromIndex = (index: number) => {
                if (input.includeGroundFloor) return index === 0 ? 0 : index;
                return index + 1;
            };

            const roomPrefixFromFloor = (floorNumber: number) =>
                floorNumber === 0 ? "G" : floorNumber.toString();

            await db.transaction(async (tx) => {
                const [property] = await tx
                    .select({
                        id: properties.id,
                    })
                    .from(properties)
                    .where(eq(properties.id, ctx.propertyId))
                    .limit(1);

                if (!property) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Property not found or access denied",
                    });
                }

                const allRooms = await tx
                    .select({
                        id: rooms.id,
                        floorNumber: rooms.floorNumber,
                        roomNumber: rooms.roomNumber,
                        status: rooms.status,
                        typeId: rooms.typeId,
                        ac: rooms.ac,
                    })
                    .from(rooms)
                    .where(eq(rooms.propertyId, ctx.propertyId));

                const roomTypes = await tx
                    .select({
                        id: propertyRoomTypes.id,
                        name: propertyRoomTypes.name,
                        maxOccupancy: propertyRoomTypes.maxOccupancy,
                    })
                    .from(propertyRoomTypes)
                    .where(eq(propertyRoomTypes.propertyId, ctx.propertyId))
                    .orderBy(propertyRoomTypes.maxOccupancy, propertyRoomTypes.name);

                const singleTypeId = roomTypes.find((roomType) => roomType.name === "Single")?.id;
                const lowestOccupancyTypeId =
                    roomTypes.find((roomType) => (roomType.maxOccupancy || 1) === 1)?.id ||
                    roomTypes[0]?.id;
                const defaultTypeId = singleTypeId || lowestOccupancyTypeId || null;
                const activeResidents = await tx
                    .select({
                        roomId: residents.roomId,
                    })
                    .from(residents)
                    .where(
                        and(
                            eq(residents.propertyId, ctx.propertyId),
                            eq(residents.status, "active"),
                        ),
                    );
                const activeResidentRoomIds = new Set(
                    activeResidents.map((resident) => resident.roomId),
                );

                const roomsByFloor = new Map<number, typeof allRooms>();
                for (const room of allRooms) {
                    const existing = roomsByFloor.get(room.floorNumber) || [];
                    existing.push(room);
                    roomsByFloor.set(room.floorNumber, existing);
                }

                const allRoomNumbers = new Set(allRooms.map((room) => room.roomNumber));
                const roomsToDelete: string[] = [];
                const roomsToInsert: RoomInsert[] = [];

                for (let i = 0; i < numFloors; i++) {
                    const floorNumber = floorNumberFromIndex(i);
                    const desiredCountRaw = input.roomsPerFloor[i.toString()];
                    const desiredCount = parseInt(desiredCountRaw || "0", 10);
                    if (!desiredCountRaw || !Number.isFinite(desiredCount) || desiredCount < 1) {
                        throw new TRPCError({
                            code: "BAD_REQUEST",
                            message: `At least one room is required for ${floorLabel(i)}.`,
                        });
                    }
                    if (desiredCount > 50) {
                        throw new TRPCError({
                            code: "BAD_REQUEST",
                            message: `Room count on ${floorLabel(i)} cannot exceed 50.`,
                        });
                    }
                    const existingRooms = [...(roomsByFloor.get(floorNumber) || [])].sort((a, b) => {
                        const slotDiff = parseRoomSlot(a.roomNumber) - parseRoomSlot(b.roomNumber);
                        if (slotDiff !== 0) return slotDiff;
                        return a.roomNumber.localeCompare(b.roomNumber, undefined, {
                            numeric: true,
                            sensitivity: "base",
                        });
                    });

                    if (desiredCount < existingRooms.length) {
                        const removableCandidates = existingRooms.slice(desiredCount);
                        const blockedRoom = removableCandidates.find(
                            (room) =>
                                room.status !== "vacant" ||
                                activeResidentRoomIds.has(room.id),
                        );
                        if (blockedRoom) {
                            throw new TRPCError({
                                code: "BAD_REQUEST",
                                message: `Cannot reduce rooms on ${floorLabel(i)} because higher room slots are occupied.`,
                            });
                        }

                        for (const room of removableCandidates) {
                            roomsToDelete.push(room.id);
                            allRoomNumbers.delete(room.roomNumber);
                        }
                    }

                    if (desiredCount > existingRooms.length) {
                        const toAdd = desiredCount - existingRooms.length;
                        const prefix = roomPrefixFromFloor(floorNumber);

                        const floorTypeId =
                            existingRooms.find((room) => room.typeId)?.typeId ||
                            defaultTypeId;

                        for (let addIndex = 0; addIndex < toAdd; addIndex++) {
                            let sequence = 1;
                            let roomNumber = `${prefix}${sequence.toString().padStart(2, "0")}`;

                            while (allRoomNumbers.has(roomNumber)) {
                                sequence += 1;
                                roomNumber = `${prefix}${sequence.toString().padStart(2, "0")}`;
                            }

                            allRoomNumbers.add(roomNumber);
                            roomsToInsert.push({
                                id: crypto.randomUUID(),
                                propertyId: ctx.propertyId,
                                floorNumber,
                                roomNumber,
                                status: "vacant",
                                typeId: floorTypeId || null,
                                customRentAmount: null,
                                ac: false,
                            });
                        }
                    }
                }

                const incomingFloorNumbers = new Set<number>();
                for (let i = 0; i < numFloors; i++) {
                    incomingFloorNumbers.add(floorNumberFromIndex(i));
                }

                for (const room of allRooms) {
                    if (incomingFloorNumbers.has(room.floorNumber)) continue;
                    if (
                        room.status !== "vacant" ||
                        activeResidentRoomIds.has(room.id)
                    ) {
                        throw new TRPCError({
                            code: "BAD_REQUEST",
                            message: "Cannot remove floors with occupied rooms.",
                        });
                    }
                    roomsToDelete.push(room.id);
                    allRoomNumbers.delete(room.roomNumber);
                }

                if (roomsToDelete.length > 0) {
                    await tx
                        .delete(rooms)
                        .where(
                            and(
                                eq(rooms.propertyId, ctx.propertyId),
                                inArray(rooms.id, roomsToDelete),
                            ),
                        );
                }

                if (roomsToInsert.length > 0) {
                    await tx.insert(rooms).values(roomsToInsert);
                }

                await tx
                    .update(properties)
                    .set({
                        floors: numFloors,
                        includeGroundFloor: input.includeGroundFloor,
                    })
                    .where(eq(properties.id, ctx.propertyId));
            });

            return { success: true };
        }),

    updateIncharge: propertyProcedure
        .input(updateInchargeSchema)
        .mutation(async ({ input, ctx }) => {
            const [updated] = await db
                .update(properties)
                .set({
                    inchargeName: input.inchargeName,
                    inchargePhone: input.inchargePhone,
                    updatedAt: new Date(),
                })
                .where(and(eq(properties.id, ctx.propertyId), eq(properties.userId, ctx.user.id)))
                .returning({
                    id: properties.id,
                    inchargeName: properties.inchargeName,
                    inchargePhone: properties.inchargePhone,
                });

            if (!updated) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Property not found or access denied",
                });
            }

            return updated;
        }),

    deleteProperty: propertyProcedure.mutation(async ({ ctx }) => {
        const scheduled = await schedulePropertyDeletion(ctx.propertyId, ctx.user.id);

        if (!scheduled) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Property not found or access denied",
            });
        }

        return {
            success: true,
            graceDays: PROPERTY_DELETION_GRACE_DAYS,
            scheduledFor: scheduled.scheduledFor,
            alreadyScheduled: scheduled.alreadyScheduled,
        };
    }),

    cancelPropertyDeletion: propertyProcedure.mutation(async ({ ctx }) => {
        const cancelled = await cancelPropertyDeletion(ctx.propertyId, ctx.user.id);

        if (!cancelled) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Property not found or access denied",
            });
        }

        return { success: true };
    }),
});
