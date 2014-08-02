ig.module(
    'game.entities.snail-guard'
)
.requires(
    'impact.entity',
    'impact.entity-pool'
)
.defines(function() {
    EntitySnailGuard = ig.Entity.extend({
        
        size: {x: 24, y: 18},
        offset: {x: 13, y: 26},
        maxVel: {x: 100, y: 220},
        friction: {x: 0, y: 0},
        accel: {x: 0, y: 0},
        flip: false,
        speed: 3,
        jump: 0,
        health: 4,
        maxHealth: 4,
        animSheet: new ig.AnimationSheet( 'media/snail-guard.png', 44, 44 ),
        
        turn: false,
        hideTime: 5,
        hideTimer: null,
        actionTimer: null,
        proximityRange: 50,
        proximityAlarm: false,
        
        idling: false,
        hurting: false,
        dying: false,
        hiding: false,
        unhiding: false,
        peeking: false,
        attacking: false,
        turning: false,
        
        pushSpeed: 5,
        pushing: false,
        
        type: ig.Entity.TYPE.B,
        checkAgainst: ig.Entity.TYPE.A,
        collides: ig.Entity.COLLIDES.PASSIVE,
        //collides: ig.Entity.COLLIDES.FIXED,
        
        init: function( x, y, settings ) {
            this.parent( x, y, settings );
            
            // add the animations
            this.addAnim( 'idle', 1, [0], true );
            this.addAnim( 'walk', 0.6, [1, 0] );
            this.addAnim( 'hurt', 0.1, [2, 2, 0, 0], true );
            this.addAnim( 'dead', 0.2, [0, 0, 0], true );
            this.addAnim( 'hide', 0.1, [0, 1, 3, 4], true );
            this.addAnim( 'unhide', 0.1, [4, 3, 1, 0, 0, 0], true );
            this.addAnim( 'peek', 0.2, [3, 3, 4], true );
            this.addAnim( 'turn', 0.2, [1, 5, 5, 1], true );
            
            this.sizeReset = this.size;
            this.offsetReset = this.offset;
            this.maxVelReset = this.maxVel;
            
            this.prepareEntity();
        },
        
        // resurrect this entity from the entity pool (pooling enabled below)
        reset: function( x, y, settings ) {
            this.parent( x, ( y - this.size.y ), settings );
            this.prepareEntity();
        },
              
        // reset parameters
        prepareEntity: function() {
            
            // reset parameters
            this.size = this.sizeReset
            this.offset = this.offsetReset;
            this.maxVel = this.maxVelReset;
            this.health = this.maxHealth;
            
            this.idling = false;
            this.hurting = false;
            this.dying = false;
            this.hiding = false;
            this.unhiding = false;
            this.peeking = false;
            this.attacking = false;
            this.turning = false;
            
            // set entity action
            //this.updateAction();
            this.walking = true;
        },
        
        update: function() {
        
            if ( ig.game.isPaused ) {
                return;
            }
            
            this.checkStatus();
            this.checkPosition();
            this.parent();
            
            // reset beig pushed
            this.pushing = false;
        },
        
        checkStatus: function() {
            
            // detect if the player is within detection range
            if ( ig.game.player ) {
                var distance = this.distanceTo( ig.game.player );
                
                // if the player is within range
                if ( distance < this.proximityRange ) {
                
                    // increase the proximity range
                    if ( ! this.proximityAlarm ) {
                        this.proximityRange += 10;
                        this.alpha = 1.0;
                    }
                    
                    this.proximityAlarm = true;
                }
                // else, the player has left the range
                else {
                
                    // reduce the proximity range and get a new action
                    if ( this.proximityAlarm ) {
                        this.alpha = 0.75;
                        this.proximityRange -= 10;
                        this.walking = false;
                        this.actionTimer = new ig.Timer( 1.0 );
                    }
                    
                    this.proximityAlarm = false;
                }
            }
            
            // if action timer ended, get a new action
            if ( this.actionTimer ) {
                if ( this.actionTimer.delta() > 0 ) {
                    this.updateAction();
                }
            }
            
            // check entity status
            this.isHurting();
            this.isHiding();
            this.isAttacking();
            this.isTurning();
            this.isMoving();
            this.animate();
        },
        
        // check if hurting
        isHurting: function() {
            
            // if dying, kill this entity when the animation ends
            if ( this.dying ) {
                if ( this.currentAnim == this.anims.dead ) {
                    if ( this.currentAnim.loopCount ) {
                        this.kill();
                    }
                }
            }
            
            // stop hurting when the animation ends
            if ( this.hurting ) {
                if ( this.currentAnim == this.anims.hurt ) {
                    if ( this.currentAnim.loopCount ) {
                        this.hiding = true;
                        this.hurting = false;
                        this.updateCollisionBox();
                    }
                }
            }
            
        },
        
        // check if hiding
        isHiding: function() {
        
            if ( this.hurting || this.dying ) {
                return;
            }
            
            // if hiding and collision is not FIXED
            if ( this.hiding && this.collides != ig.Entity.COLLIDES.FIXED ) {
                this.collides = ig.Entity.COLLIDES.FIXED;
            }
            // if not hiding and collision is not PASSIVE
            else if ( ! this.hiding && this.collides != ig.Entity.COLLIDES.PASSIVE  ) {
                this.collides = ig.Entity.COLLIDES.PASSIVE;
            }
            
            // stop unhiding when the animation ends
            if ( this.unhiding ) {
                if ( this.currentAnim == this.anims.unhide ) {
                    if ( this.currentAnim.loopCount ) {
                        this.unhiding = false;
                        this.walking = true;
                        this.updateCollisionBox();
                    }
                }
            }
            
            // if hiding
            if ( this.hiding ) {
            
                // if the player is close, remove the hide timer
                if ( this.proximityAlarm && this.hideTimer != null ) {
                    this.hideTimer = null;
                }
                
                // if player has moved away, start the hide timer
                if ( ! this.proximityAlarm && this.hideTimer == null ) {
                    this.hideTimer = new ig.Timer( this.hideTime );
                }
                
                // if the hide timer is running
                if ( this.hideTimer ) {
                
                    // peek before unhiding
                    if ( this.hideTimer.delta() > -1.0 ) {
                        this.peeking = true;
                    }
                    
                    // check if the hide timer has ended
                    if ( this.hideTimer.delta() > 0 ) {
                        this.hiding = false;
                        this.peeking = false;
                        this.unhiding = true;
                        this.hideTimer = null;
                        this.updateCollisionBox();
                    }
                }
                
            }
            
        },
        
        // check if attacking
        isAttacking: function() {
        
            if ( this.hurting || this.dying ) {
                return;
            }
            
        },
        
        // check if turning around
        // *this entity is wide enough that it needs an animation when turning around
        isTurning: function() {
            
            if ( this.hurting || this.dying || this.hiding || this.unhiding ) {
                this.turn = false;
                this.turning = false;
                return;
            }
            
            // if the entity is turning around
            if ( this.turning ) {
                if ( this.currentAnim == this.anims.turn ) {
                    
                    // flip the entity when reaching the middle frame
                    if ( this.currentAnim.frame == 2 ) {
                        if ( this.turn ) {
                            this.flip = !this.flip;
                            this.turn = false;
                            this.updateCollisionBox();
                        }
                    }
                    
                    // stop turning and begin walking when animation ends
                    if ( this.currentAnim.loopCount ) {
                        this.turning = false;
                        this.walking = true;
                        this.updateCollisionBox();
                    }
                    
                }
            }
            
            // if the entity needs to turn around
            if ( this.turn ) {
                this.turning = true;
                this.walking = false;
                this.updateCollisionBox();
            }
            
        },
        
        // check if moving
        isMoving: function() {
            
            if ( this.hurting || this.dying ) {
                return;
            }
            
            //if ( this.hiding || this.unhiding ) {
                //this.vel.x = 0;
                //return;
            //}
            
            if ( this.walking ) {
                this.vel.x = this.speed * ( this.flip ? -1 : 1 );
            } else {
                this.vel.x = 0;
            }
            
            if ( this.hiding ) {
                this.vel.x = 0;
                if ( this.pushing ) {
                    this.vel.x = this.pushingSpeed;
                }
            }
            
            /*
            // if the player is within range
            if ( this.proximityAlarm ) {
                if ( ig.game.player.pos.x < this.pos.x ) {
                    this.flip = true; // face left
                    this.walking = true;
                }
                else if ( ig.game.player.pos.x > ( this.pos.x + this.size.x ) ) {
                    this.flip = false; // face right
                    this.walking = true;
                }
            }
            */
            
        },
        
        // update entity animation
        animate: function() {
            
            // update animation state
            if ( this.dying ) {
                if ( this.currentAnim != this.anims.dead ) {
                    this.currentAnim = this.anims.dead.rewind();
                }
            }
            else if ( this.hurting ) {
                if ( this.currentAnim != this.anims.hurt ) {
                    this.currentAnim = this.anims.hurt.rewind();
                }
            }
            else if ( this.peeking ) {
                if ( this.currentAnim != this.anims.peek ) {
                    this.currentAnim = this.anims.peek.rewind();
                }
            }
            else if ( this.hiding ) {
                if ( this.currentAnim != this.anims.hide ) {
                    this.currentAnim = this.anims.hide.rewind();
                }
            }
            else if ( this.unhiding ) {
                if ( this.currentAnim != this.anims.unhide ) {
                    this.currentAnim = this.anims.unhide.rewind();
                }
            }
            else if ( this.turning ) {
                if ( this.currentAnim != this.anims.turn ) {
                    this.currentAnim = this.anims.turn.rewind();
                }
            }
            else if ( this.walking ) {
                if ( this.currentAnim != this.anims.walk ) {
                    this.currentAnim = this.anims.walk.rewind();
                }
            }
            else {
                if ( this.currentAnim != this.anims.idle ) {
                    this.currentAnim = this.anims.idle.rewind();
                }
            }
            
            // update facing direction
            this.currentAnim.flip.x = this.flip;
            
            // update entitiy opacity
            /*
            if ( this.hurting ) {
                this.currentAnim.alpha = 0.5;
            }
            else if ( this.currentAnim.alpha < 1 ) {
                this.currentAnim.alpha = 1;
            }
            */
            this.currentAnim.alpha = this.alpha;
        },
        
        // check if this entity needs repositioned
        checkPosition: function() {
            
            // if entity has reached the edge of a platform
            if ( ! this.hurting && this.standing ) {
                var xPos = this.pos.x + ( this.flip ? -1 : this.size.x + 1 );
                var yPos = ( this.pos.y + this.size.y + 1 );
                if ( ! ig.game.collisionMap.getTile( xPos, yPos ) ) {
                    this.turn = true;
                }
            }
            
            // if this entity has moved off the map
            if ( this.pos.x < 0 ) {
                this.pos.x = ( ig.game.collisionMap.pxWidth - ( this.size.x * 2 ) );
            }
            else if ( ( this.pos.x + this.size.x ) > ig.game.collisionMap.pxWidth ) {
                this.pos.x = this.size.x;
            }
            
            // if this entity has fallen off the map
            if ( this.pos.y > ig.game.collisionMap.pxHeight ) {
                this.pos.y = 0;
            }
            
        },
                
        // update entity action
        updateAction: function() {
            /*
            if ( this.hurting || this.dying || this.hiding || this.unhiding ) {
                return;
            }
            
            if ( this.proximityAlarm ) {
                this.actionTimer = null;
                return;
            }
            
            // get a random number 1 - 5
            var num = Math.floor( ( Math.random() * 5 ) + 1 );
            switch ( num ) {
                // walk right
                case 5:
                case 4:
                    this.flip = false;
                    this.walking = true;
                    break;
                
                // walk left
                case 3:
                case 2:
                    this.flip = true;
                    this.walking = true;
                    break;
                
                // stand still
                default:
                    this.walking = false;
            }
            
            // reset action timer to 1 - 5 seconds
            var timer = Math.floor( ( Math.random() * 5 ) + 1 );
            this.actionTimer = new ig.Timer( timer );
            */
        },
        
        // update the size of the collision box
        updateCollisionBox: function() {
        
            if ( this.hiding || this.unhiding ) {
                if ( this.flip && this.size.x == 24 ) {
                    this.pos.x += 6;
                }
                this.size.x = 18;
                this.size.y = 18;
                this.offset.x = 13;
                this.offset.y = 26;
            }
            else {
                if ( this.flip && this.size.x == 18 ) {
                    this.pos.x -= 6;
                }
                this.size.x = 24;
                this.size.y = 18;
                this.offset.x = ( this.flip ? 7 : 13 );
                this.offset.y = 26;
            }
            
        },
        
        // called when overlapping .checkAgainst entities
        check: function( other ) {
            
            if ( this.hurting || this.dying || this.hiding || this.unhiding ) {
                return;
            }
            
            other.receiveDamage( 1, this );
        },
        
        // called when overlapping .checkAgainst entities
        collideWith: function( other, axis ) {
            
            if ( this.hurting || this.dying ) {
                return;
            }
            
            /** /
            // if hiding and colliding with the player on the x-axis
            if ( this.hiding ) {
                if ( other instanceof EntityPlayer ) {
                    if ( other.standing && axis == 'x' ) {
                    
                        // tell the player they are "pushing"
                        other.pushing = true;
                        other.pushingEntity = this;
                        
                        // set the incremental distance to move
                        var mx = ( 5 * ig.system.tick );
                        
                        // if the player is pushing from the left side
                        if ( other.pos.x < this.pos.x ) {
                        
                            // check for a wall to the right
                            var xPos = ( this.pos.x + this.size.x + 1 );
                            var yPos = ( this.pos.y + this.size.y - 1 );
                            if ( ! ig.game.collisionMap.getTile( xPos, yPos ) ) {
                                this.pos.x += mx; // move to the right
                            }
                        }
                        
                        // else, the player is pushing from the right side
                        else if ( other.pos.x > this.pos.x ) {
                        
                            // check for a wall to the left
                            var xPos = ( this.pos.x + - 1 );
                            var yPos = ( this.pos.y + this.size.y - 1 );
                            if ( ! ig.game.collisionMap.getTile( xPos, yPos ) ) {
                                this.pos.x -= mx; // move to the left
                            }
                        }
                        
                    }
                    
                }
            }
            /**/
            
            // if hiding and colliding with the player on the x-axis
            if ( this.hiding ) {
                if ( other instanceof EntityPlayer ) {
                    if ( other.standing && axis == 'x' ) {
                        other.isCollidingWith = this;
                    }
                }
            }
            
        },
        
        beingPushed: function( other, direction ) {
            
            // set the incremental distance to move
            var mx = ( this.pushSpeed * ig.system.tick );
            
            // move to the left
            if ( direction == 'left' ) {

                // check for a wall to the left
                var xPos = ( this.pos.x + - 1 );
                var yPos = ( this.pos.y + this.size.y - 1 );
                if ( ! ig.game.collisionMap.getTile( xPos, yPos ) ) {
                    this.pos.x -= mx;
                    //other.pos.x -= mx;
                }
                
            }
            // else, move to the right
            else if ( direction == 'right' ) {
            
                // check for a wall to the right
                var xPos = ( this.pos.x + this.size.x + 1 );
                var yPos = ( this.pos.y + this.size.y - 1 );
                if ( ! ig.game.collisionMap.getTile( xPos, yPos ) ) {
                    this.pos.x += mx;
                    //other.pos.x += mx;
                }
                
            }
        },
        
        beingPulled: function( other, direction ) {
            
            // set the incremental distance to move
            var mx = ( this.pushSpeed * ig.system.tick );
            
            // move to the left
            if ( direction == 'left' ) {
                this.pos.x -= mx;
                //other.pos.x -= mx;
            }
            // else, move to the right
            else if ( direction == 'right' ) {
                this.pos.x += mx;
                //other.pos.x += mx;
            }
        },
        
        // test collisions against the CollisionMap
        handleMovementTrace: function( res ) {
            this.parent( res );
            
            // change direction if hitting a wall
            if ( res.collision.x ) {
                this.turn = true;
            }
        },
        
        // called by attacking entity
        receiveDamage: function( amount, from ) {
        
            if ( this.hurting || this.dying || this.hiding || this.unhiding ) {
                return false;
            }
            
            // reduce health
            //this.health -= amount;
            
            // if dead
            if ( this.health <= 0 ) {
                this.vel = {x: 0, y: 0};
                this.maxVel = {x: 0, y: 0};
                this.dying = true;
                return true;
            }
            
            // update state
            this.hurting = true;
            
            // stop moving
            this.vel.x = 0;
            
            // apply knockback
            //this.vel.x = ( from.flip ? -80 : 80 );
            //this.vel.y = -100;
            
            return true;
        }
        
    });
    
    ig.EntityPool.enableFor( EntitySnailGuard );
});