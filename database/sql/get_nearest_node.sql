CREATE OR REPLACE FUNCTION get_nearest_node(p_lon double precision, p_lat double precision)
RETURNS bigint AS $$
DECLARE
    node_id bigint;
BEGIN
    SELECT id INTO node_id
    FROM ways_vertices_pgr
    ORDER BY the_geom <-> ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)
    LIMIT 1;
    RETURN node_id;
END;
$$ LANGUAGE plpgsql;