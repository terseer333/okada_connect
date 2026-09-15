"""Run the API with the embedded pgserver Postgres kept alive in-process."""
import pgserver

pg = pgserver.get_server("/home/student/okada_connect/.pgserver")  # noqa: F841 (holds the server open)

import uvicorn

uvicorn.run("main:app", host="0.0.0.0", port=4000, reload=False)
