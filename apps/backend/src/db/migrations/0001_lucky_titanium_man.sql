-- Custom SQL migration file, put your code below! --

CREATE INDEX IF NOT EXISTS "property_search_idx" ON "property" USING gin ((
    setweight(to_tsvector('english', coalesce("name", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("area", '')), 'B') ||
    setweight(to_tsvector('english', coalesce("city", '')), 'C') ||
    setweight(to_tsvector('english', coalesce("addressLine1", '')), 'D') ||
    setweight(to_tsvector('english', coalesce("type", '')), 'D')
));

CREATE INDEX IF NOT EXISTS "property_room_type_search_idx" ON "property_room_type" USING gin ((
    setweight(to_tsvector('english', coalesce("name", '')), 'A')
));

CREATE INDEX IF NOT EXISTS "room_search_idx" ON "room" USING gin ((
    setweight(to_tsvector('english', coalesce("roomNumber", '')), 'A')
));

CREATE INDEX IF NOT EXISTS "resident_search_idx" ON "resident" USING gin ((
    setweight(to_tsvector('english', coalesce("name", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("phoneNumber", '')), 'B')
));

CREATE INDEX IF NOT EXISTS "complaint_search_idx" ON "complaint" USING gin ((
    setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("description", '')), 'B')
));

CREATE INDEX IF NOT EXISTS "notice_search_idx" ON "notice" USING gin ((
    setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("description", '')), 'B')
));

CREATE INDEX IF NOT EXISTS "checkout_search_idx" ON "checkout" USING gin ((
    setweight(to_tsvector('english', coalesce("name", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("roomNumber", '')), 'B') ||
    setweight(to_tsvector('english', coalesce("phoneNumber", '')), 'C')
));

CREATE INDEX IF NOT EXISTS "support_query_search_idx" ON "support_query" USING gin ((
    setweight(to_tsvector('english', coalesce("query", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("landlordName", '')), 'B') ||
    setweight(to_tsvector('english', coalesce("inchargeName", '')), 'C') ||
    setweight(to_tsvector('english', coalesce("city", '')), 'D') ||
    setweight(to_tsvector('english', coalesce("address", '')), 'D')
));

CREATE INDEX IF NOT EXISTS "feedback_search_idx" ON "feedback" USING gin ((
    setweight(to_tsvector('english', coalesce("description", '')), 'A')
));
