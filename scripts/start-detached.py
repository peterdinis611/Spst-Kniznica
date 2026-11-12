#!/usr/bin/env python3
"""Start the SPST stack in a new process session (survives parent shell exit)."""

from __future__ import annotations

import json
import os
import subprocess
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
WEB = ROOT / "web"
LOG = ROOT / ".run" / "logs"
PID = ROOT / ".run" / "pids"

SERVICES = [
    ("author", "AuthorService/AuthorService.csproj", "http://127.0.0.1:5207"),
    ("category", "CategoryService/CategoryService.csproj", "http://127.0.0.1:5204"),
    ("book", "BookService/BookService.csproj", "http://127.0.0.1:5203"),
    ("booking", "BookingService/BookingService.csproj", "http://127.0.0.1:5208"),
    ("workers", "WorkersService/WorkersService.csproj", "http://127.0.0.1:5209"),
    ("messaging", "MessagingService/MessagingService.csproj", "http://127.0.0.1:5205"),
    ("cache", "CacheService/CacheService.csproj", "http://127.0.0.1:5206"),
    ("gateway", "GatewayService/GatewayService.csproj", "http://127.0.0.1:5200"),
]


def stop_ports() -> None:
    subprocess.run(["bash", str(ROOT / "scripts/stop-all.sh")], check=False)
    time.sleep(0.5)
    for port in [3000, 5200, 5203, 5204, 5205, 5206, 5207, 5208, 5209]:
        result = subprocess.run(
            ["lsof", f"-tiTCP:{port}", "-sTCP:LISTEN"],
            capture_output=True,
            text=True,
            check=False,
        )
        for pid in result.stdout.split():
            subprocess.run(["kill", "-9", pid], check=False)


def spawn(name: str, args: list[str], cwd: Path | None = None, env: dict[str, str] | None = None) -> int:
    LOG.mkdir(parents=True, exist_ok=True)
    PID.mkdir(parents=True, exist_ok=True)
    log = open(LOG / f"{name}.log", "ab", buffering=0)
    merged = os.environ.copy()
    if env:
        merged.update(env)
    proc = subprocess.Popen(
        args,
        cwd=str(cwd) if cwd else None,
        env=merged,
        stdout=log,
        stderr=subprocess.STDOUT,
        stdin=subprocess.DEVNULL,
        start_new_session=True,
    )
    (PID / f"{name}.pid").write_text(str(proc.pid))
    print(f"  · {name}  pid={proc.pid}")
    return proc.pid


def wait_http(name: str, url: str, attempts: int = 80) -> bool:
    for _ in range(attempts):
        try:
            with urllib.request.urlopen(url, timeout=1) as response:
                if 200 <= response.status < 500:
                    print(f"  ✓ {name} ready")
                    return True
        except Exception:
            time.sleep(0.4)
    print(f"  ! {name} not ready yet (see {LOG / (name + '.log')})")
    return False


def main() -> int:
    print("==> SPST Knižnica – detached start")
    print(f"    root: {ROOT}")
    stop_ports()

    print("\n==> Building .NET solution")
    subprocess.run(
        ["dotnet", "build", "SpstKniznica.sln", "-c", "Debug", "--nologo", "-v", "q"],
        cwd=SRC,
        check=True,
    )

    print("\n==> .NET services")
    for name, project, url in SERVICES:
        project_dir = (SRC / project).parent
        spawn(
            name,
            [
                "dotnet",
                "run",
                "--project",
                str(SRC / project),
                "--no-build",
                "--no-launch-profile",
            ],
            cwd=project_dir,
            env={
                "ASPNETCORE_ENVIRONMENT": "Development",
                "ASPNETCORE_URLS": url,
                "DOTNET_ENVIRONMENT": "Development",
            },
        )

    print("\n==> Frontend")
    spawn(
        "web",
        ["npm", "run", "dev", "--", "--hostname", "127.0.0.1", "--port", "3000"],
        cwd=WEB,
    )

    print("\n==> Waiting for health endpoints")
    for name, _, url in SERVICES:
        wait_http(name, f"{url}/health")
    wait_http("web", "http://127.0.0.1:3000/")

    with urllib.request.urlopen(
        "http://127.0.0.1:5200/api/bookings?page=1&pageSize=5&sortBy=dueDate&sortDir=asc"
    ) as response:
        payload = json.load(response)
    print(f"\n==> BookingService via gateway OK ({payload.get('totalCount', 0)} lístkov)")
    print("\n  Frontend  http://127.0.0.1:3000/bookings")
    print("  Gateway   http://127.0.0.1:5200/swagger")
    print(f"  Stop      {ROOT / 'scripts/stop-all.sh'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
