import logging
import time
from contextlib import contextmanager
from typing import Iterator


def configure_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )


@contextmanager
def timed(logger: logging.Logger, event: str, **fields: object) -> Iterator[None]:
    started = time.perf_counter()
    try:
        yield
    finally:
        duration_ms = round((time.perf_counter() - started) * 1000, 1)
        logger.info("event=%s duration_ms=%s %s", event, duration_ms, fields)
