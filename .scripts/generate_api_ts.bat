docker run -v %CD%/schemas:/schemas -v %CD%/api:/api -v %CD%/.scripts/generate_api_ts.sh:/generate_api_ts.sh -it --rm node sh generate_api_ts.sh