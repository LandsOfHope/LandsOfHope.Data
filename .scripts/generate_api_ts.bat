docker run ^
    -v %CD%/schemas:/schemas ^
    -v "%CD%:/work" ^
    --workdir /work/.scripts ^
    -it --rm node sh ./generate_api_ts.sh