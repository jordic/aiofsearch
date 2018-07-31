


# 🤙 Aio File Search 😂 #hackyhollidays

## AioHTTP + Preact + Parcel + Websockets

Search your local files through a Browser interface

This is just a demo project on how to integrate WS Streaming responses
into a Preact Web App.


## Install

``` pip install aiofilesearch ```

## Run

``` fsearch ```

* You need to have installed The silver search, and sublime if you want
to open results with it.


## Interesting Parts

- The front side uses preact + parcel bundler. So easy to start!
- The backend part uses asyncio subprocess to launch the ag command and start searching
- Results are streamded from the ag command to the websocket frontend.


## Todo

 - Add configuration params 
