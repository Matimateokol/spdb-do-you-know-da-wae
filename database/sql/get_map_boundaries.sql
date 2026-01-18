CREATE OR REPLACE FUNCTION get_map_boundaries()
RETURNS TABLE (
    min_lat double precision, 
    min_lon double precision, 
    max_lat double precision, 
    max_lon double precision
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ST_YMin(ST_Extent(the_geom)) as min_lat,
        ST_XMin(ST_Extent(the_geom)) as min_lon,
        ST_YMax(ST_Extent(the_geom)) as max_lat,
        ST_XMax(ST_Extent(the_geom)) as max_lon
    FROM ways;
END;
$$ LANGUAGE plpgsql;