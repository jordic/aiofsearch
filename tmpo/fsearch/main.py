
from aiohttp import web
from asyncio import subprocess
from asyncio import create_subprocess_exec
from asyncio import ensure_future
from os.path import join
from os.path import dirname

import aiohttp
import asyncio
import os
import json
import logging


logger = logging.getLogger('aiofsearch')


_curr_path = os.getcwd()
_empty = b'\n'
_static = join(
    dirname(dirname(__file__)),
    'front', 'dist'
)


class Result:
    def __init__(self, file, path, found):
        self.file = file.decode('utf-8')
        self.path = path
        self.lines = []
        self.found = found

    def encode(self):
        return json.dumps(dict(
            base=self.path,
            file=self.file.replace(self.path, ""),
            lines=self.lines,
            found=self.found
        ))

    def add(self, line):
        try:
            self.lines.append(line.decode('utf-8'))
        except UnicodeDecodeError:
            # ommit unicode errors
            pass



async def make_app():
    print(f'static {_static}')
    app = web.Application()
    app.add_routes([web.get('/-/search', search_files)])
    app.add_routes([web.get('/-/open', open_file)])
    app.add_routes([web.get('/', index_html)])
    app.add_routes([web.static('/', _static, show_index=True)])
    return app


async def index_html(request):
    return web.FileResponse(join(_static, 'index.html'))


async def open_file(request):
    file = request.query.get('f')
    line = request.query.get('l', '0')
    if file:
        logger.info(f'opened {_curr_path}{file}:{line}')
        cmd = ["/usr/bin/subl", f'{_curr_path}{file}:{line}']
        await create_subprocess_exec(*cmd)
    return web.json_response(dict(result='ok'))


async def process_ws(ws, process): 
    result = None
    counter = 0
    while True:
        try:
            line = await process.stdout.readline()
        except ValueError:
            pass

        if line:
            if not result:
                counter = counter + 1
                result = Result(line[:-1], _curr_path, counter)
            elif line != _empty:
                result.add(line[:-1])
            else:
                await ws.send_str(result.encode())
                result = None
        else:
            await ws.close()
            logger.debug('stop loop: no line')
            break

        if process.returncode:
            logger.debug('stop loop: process exit')
            break

        if ws.closed:
            logger.debug('stop loop: ws closed')
            break


async def search_files(request):
    query = request.query.get('q', 'StreamResponse')
    cmd = [
        "/usr/bin/ag", query, _curr_path, '--nocolor', '--group',
        "--ignore", "*.min*", "--ignore", "*.map*", "--ignore",
        "*node_modules*", "--ignore", "*env*"
    ]
    process = await create_subprocess_exec(
        *cmd, stdout=subprocess.PIPE
    )

    ws = web.WebSocketResponse()
    await ws.prepare(request)
    task = ensure_future(process_ws(ws, process))    
    async for msg in ws:
        if msg.type == aiohttp.WSMsgType.TEXT:
            if msg.data == 'close':
                logger.info('client had disconnected')
                await ws.close()
                process.kill()

        elif msg.type == aiohttp.WSMsgType.ERROR:
            logger.error('ws connection closed with exception %s' %
                  ws.exception())

    return ws


if __name__ == "__main__":
    web.run_app(make_app())


def run():
    web.run_app(make_app())