# devproxyhub

This tool simply proxies your request to the actual target, and caches the results in redis.
This allows you to locally not be dependent on network / server compute speed.

## Usage
Currently in the index.js
modify the HOST_TARGET to the place you want to actually access.

all the request are passed on atleast the post bodies and authorization headers.
Anythong else is undefined behavior, but this is probably fine for most use cases.

use
`docker compose up`
to start both the proxy and the redis cache.

Then in your app replace your target with http://localhost:3000.
In the index.js set the HOST_TARGET.
Then start the service.

Now use the app targeting localhost:3000, the first time is normal speed, but the requests after should be significantly sped up.

Or to force a rebuild:
`docker-compose up --force-recreate `

## Reserved routes
`/driesdries_keys`
This returns the cached routes.

`/clear-cache`
This empties out the existig cache.

#