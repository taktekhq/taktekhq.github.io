#!/bin/sh
# keep the Worker's copy of the engine identical to the page's
cd "$(dirname "$0")" && cp ../engine.js src/engine.js && echo synced
