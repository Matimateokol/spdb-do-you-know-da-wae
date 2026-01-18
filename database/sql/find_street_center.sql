CREATE OR REPLACE FUNCTION find_street_center(street_name text)
RETURNS TABLE (lat double precision, lon double precision) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ST_Y(ST_Centroid(ST_Union(the_geom))) as lat,
        ST_X(ST_Centroid(ST_Union(the_geom))) as lon
    FROM ways
    WHERE name ILIKE street_name; -- ILIKE sprawia, że wielkość liter nie ma znaczenia
END;
$$ LANGUAGE plpgsql;