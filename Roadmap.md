
# IDea: Conway's Frogger

You are trying to cross a "stream" of game of life pixels.
Successive stages have a wider "stream" that you have to cross.

The full width of the simulated world would be rather wider, and it "goes under" the bank on either side.
The bank that you stand on is partially transaprent, so you can see "what's coming".

Dead pixels stay traversable for a small amount of time.
You jump from spot to spot. max jump is maybe a couple of pixels in distance.

Simulation would initialize with random seeds, but you wouldn't be allowed to get on the stream until a couple of ticks have settled things? or maybe you could take the chance 🙃.

Maybe have a "powerup" that would allow you to freeze the simulation for a couple of seconds?
Or have it be a "resource" that depleats and then refills if you don't use it for a little while?

Also have the ability to "toss a rock into the pond", spawning a random clump of cells.

look into https://github.com/Web3Kev/Starter-Kit-3D-Platformer-R3F-XR


# Detect Stale...

- # of cells that are dead & created from the previous step, if that is stable for more than ~5 steps,
  we're probably stalled

OH NO I'm eating gliders. they deserve to live.


#

- [x] more interesting dropoff
- [x] multistep thanks
- [x] allow single step mode
- [x] verify that the mutation is actually working
- [ ] side-by-sideeeeee all the modes at once
- [ ] write an article, its so fun
- [ ] custom rules for fancy modess

honestlyyy I want this on my phone

what abouuut other ways to tile the plane?
- triangles : 3 ... or 9 or 12 neighbors
- hexagons : 6 neighbors, or like 3 I guess
- a...sphere

/*

      00 01 02 03
       10 11 12 13
      20 21 22 23
       30 31 32 33

*/
