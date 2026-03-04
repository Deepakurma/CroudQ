export const FLOORS = [
    "Ground",
    "1st",
    "2nd",
    "3rd",
    "4th",
    "5th",
    "6th",
    "7th",
    "8th",
    "9th",
    "10th",
];

export const ROOMS_PER_FLOOR = 15;

export interface Room {
    id: string;
    roomNumber: string;
    floor: string;
    type: string;
    isAc: boolean;
    price: string;
    totalCapacity: number;
    currentOccupancy: number;
}

export const generateRooms = (): Room[] => {
    const rooms = [];

    for (let f = 0; f < FLOORS.length; f++) {
        const floorName = FLOORS[f];
        const isGroundFloor = f === 0;
        const prefix = isGroundFloor ? "G" : `${f}`;

        for (let r = 1; r <= ROOMS_PER_FLOOR; r++) {
            const randomPrice = Math.floor(Math.random() * (10000 - 5000 + 1) + 5000);

            rooms.push({
                id: `${floorName}-${r}`,
                roomNumber: `${prefix}${String(r).padStart(2, "0")}`,
                floor: floorName,
                type: r % 2 === 0 ? "2 Sharing" : "3 Sharing",
                isAc: r % 3 === 0,
                price: randomPrice.toString(),
                totalCapacity: r % 2 === 0 ? 2 : 3,
                currentOccupancy: Math.floor(Math.random() * ((r % 2 === 0 ? 2 : 3) + 1)), // 0 to capacity
            });
        }
    }

    return rooms;
};
