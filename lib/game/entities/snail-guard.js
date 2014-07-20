ig.module(
    'game.entities.snail-guard'
)
.requires(
    'impact.entity',
    'impact.entity-pool'
)
.defines(function() {
    EntitySnailGuard = ig.Entity.extend({
        
        size: {x: 20, y: 18},
        offset: {x: 12, y: 26},
        maxVel: {x: 100, y: 220},
        friction: {x: 0, y: 0},
        accel: {x: 0, y: 0},
        flip: false,
        speed: 3,
        jump: 220,
        health: 4,
        maxHealth: 4,
        animSheet: new ig.AnimationSheet( 'media/snail-guard.png', 44, 44 ),
        
        hideTime: 5,
        hideTimer: null,
        actionTimer: null,
        proximityRange: 30,
        proximityAlarm: false,
        
        idling: false,
        hurting: false,
        dying: false,
        hiding: false,
        unhiding: false,
        peeking: false,
        jumping: false,
        falling: false,
        attacking: false,
        
        type: ig.Entity.TYPE.B,
        checkAgainst: ig.Entity.TYPE.A,
        collides: ig.Entity.COLLIDES.PASSIVE,
        //collides: ig.Entity.COLLIDES.FIXED,
        
        init: function( x, y, settings ) {
            this.parent( x, ( y - this.size.y ), settings );
            
            // add the animations
            this.addAnim( 'idle', 1, [0], true );
            this.addAnim( 'walk', 0.6, [0, 1] );
            this.addAnim( 'jump', 1, [0], true );
            this.addAnim( 'fall', 1, [0], true );
            this.addAnim( 'hurt', 0.1, [2, 2, 0, 0], true );
            this.addAnim( 'dead', 0.2, [0, 0, 0], true );
            this.addAnim( 'hide', 0.1, [0, 1, 3, 4], true );
            this.addAnim( 'unhide', 0.1, [4, 3, 1, 0, 0, 0], true );
            this.addAnim( 'peek', 0.2, [3, 3, 4], true );
            
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
            this.jumping = false;
            this.falling = false;
            this.attacking = false;
            
            // set entity action
            //this.updateAction();
            this.walking = true;
        },
        
        update: function() {
        
            if ( ig.game.isPaused ) {
                return;
            }
            
            // if the player is within range
            this.proximityAlarm = false
            if ( ig.game.player ) {
                var distance = this.distanceTo( ig.game.player );
                if ( distance < this.proximityRange ) {
                    this.proximityAlarm = true;
                }
            }
            
            this.checkStatus();
            this.checkPosition();
            this.parent();
        },
        
        checkStatus: function() {
            
            // if action timer ended
            if ( this.actionTimer ) {
                if ( this.actionTimer.delta() > 0 ) {
                    this.updateAction();
                }
            }
            
            // check entity status
            this.isHurting();
            this.isHiding();
            this.isAttacking();
            this.isJumping();
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
                    }
                }
            }
            
            /*
            // stop hurting when the entity lands
            if ( this.hurting ) {
                if ( this.currentAnim == this.anims.hurt ) {
                    if ( this.standing ) {
                        this.hurting = false;
                    }
                }
            }
            */
            
        },
        
        // check if hiding
        isHiding: function() {
        
            if ( this.hurting || this.dying ) {
                return;
            }
            
            // if hiding, but collision is not fixed
            if ( this.hiding && this.collides != ig.Entity.COLLIDES.FIXED ) {
                this.collides = ig.Entity.COLLIDES.FIXED;
            }
            // if not hiding, but collision is fixed
            else if ( ! this.hiding && this.collides != ig.Entity.COLLIDES.PASSIVE  ) {
                this.collides = ig.Entity.COLLIDES.PASSIVE;
            }
            
            // stop unhiding when the animation ends
            if ( this.unhiding ) {
                if ( this.currentAnim == this.anims.unhide ) {
                    if ( this.currentAnim.loopCount ) {
                        this.unhiding = false;
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
        
        // check if jumping
        isJumping: function() {
            
            if ( this.hurting || this.dying ) {
                this.jumping = false;
                this.falling = false;
                return;
            }
            
            // if falling
            if ( this.vel.y > 0 && ! this.standing ) {
                this.falling = true;
                return;
            }
            
            // if standing on something while jumping/falling
            if ( ( this.jumping || this.falling ) && this.standing ) {
                this.jumping = false;
                this.falling = false;
            }
            
        },
        
        // check if moving
        isMoving: function() {
            
            if ( this.hurting || this.dying ) {
                return;
            }
            
            if ( this.hiding || this.unhiding ) {
                this.vel.x = 0;
                return;
            }
            
            // if the player is within range
            /*if ( this.proximityAlarm ) {
                if ( ig.game.player.pos.x < this.pos.x ) {
                    this.flip = true; // face left
                }
                else if ( ig.game.player.pos.x > ( this.pos.x + this.size.x ) ) {
                    this.flip = false; // face right
                }
            }*/
            
            if ( this.walking ) {
                this.vel.x = this.speed * ( this.flip ? -1 : 1 );
            } else {
                this.vel.x = 0;
            }
            
        },
        
        // update entity animation
        animate: function() {
            
            // update entitiy opacity
            if ( this.hurting ) {
                this.currentAnim.alpha = 0.5;
            }
            else if ( this.currentAnim.alpha < 1 ) {
                this.currentAnim.alpha = 1;
            }
            
            // update animation state
            if ( this.dying ) {
                if ( this.currentAnim != this.anims.dead ) {
                    this.currentAnim = this.anims.dead.rewind();
                }
            }
            else if ( this.peeking ) {
                if ( this.currentAnim != this.anims.peek ) {
                    this.currentAnim = this.anims.peek.rewind();
                }
            }
            else if ( this.hurting ) {
                if ( this.currentAnim != this.anims.hurt ) {
                    this.currentAnim = this.anims.hurt.rewind();
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
            else if ( this.falling ) {
                if ( this.currentAnim != this.anims.fall ) {
                    this.currentAnim = this.anims.fall.rewind();
                }
            }
            else if ( this.jumping ) {
                if ( this.currentAnim != this.anims.jump ) {
                    this.currentAnim = this.anims.jump.rewind();
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
        },
        
        // check if this entity needs repositioned
        checkPosition: function() {
            
            // if entity has reached the edge of a platform
            if ( ! this.hurting && ! this.jumping && ! this.falling ) {
                var xPos = this.pos.x + ( this.flip ? -1 : this.size.x + 1 );
                var yPos = ( this.pos.y + this.size.y + 1 );
                if ( ! ig.game.collisionMap.getTile( xPos, yPos ) ) {
                    this.flip = !this.flip;
                    this.vel.x = ( this.vel.x > 0 ? -this.vel.x : this.vel.x );
                }
            }
            
            // if this entity has moved off the map
            if ( this.pos.x < ig.game.camera.offset.x.min ) {
                this.pos.x = ( ig.game.collisionMap.pxWidth - ig.game.camera.offset.x.max - ( this.size.x * 2 ) );
            }
            else if ( ( this.pos.x + this.size.x ) > ( ig.game.collisionMap.pxWidth - ig.game.camera.offset.x.max ) ) {
                this.pos.x = ( ig.game.camera.offset.x.min + this.size.x );
            }
            
            // if this entity has fallen off the map
            if ( this.pos.y > ig.game.collisionMap.pxHeight ) {
                this.pos.y = 0;
            }
            
        },
                
        // update entity action
        updateAction: function() {
            
            if ( this.hurting || this.dying || this.hiding || this.unhiding ) {
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
        },
        
        // called when this entity overlaps with an entity matching the .checkAgainst property
        check: function( other ) {
            
            if ( this.hurting || this.dying || this.hiding || this.unhiding ) {
                return;
            }
            
            other.receiveDamage( 1, this );
        },
        
        collideWith: function( other, axis ) {
            
            if ( this.hurting || this.dying ) {
                return;
            }
            
            // if hiding and colliding with the player on the x-axis
            if ( this.hiding ) {
                if ( other instanceof EntityPlayer ) {
                    if ( axis == 'x' ) {
                        
                        /*
                        var mx = ( 5 * ig.system.tick );
                        var my = 0;
                        var res = ig.game.collisionMap.trace( 
                            this.pos.x, this.pos.y, mx, my, this.size.x, this.size.y
                        );
                        //this.handleMovementTrace( res );
                        console.log(res.collision.x);
                        if ( ! res.collision.x ) {
                        
                            // if the player is pushing from the left side
                            if ( ig.game.player.pos.x < this.pos.x ) {
                                this.pos.x += mx;//( 5 * ig.system.tick );
                            }
                            // else, the player is pushing from the right side
                            else if ( ig.game.player.pos.x > this.pos.x ) {
                                this.pos.x -= mx;//( 5 * ig.system.tick );
                            }
                        
                        }
                        */
                        
                        /*
                        var mx = ( 5 * ig.system.tick );
                        var my = 0;
                        
                        var px = ( this.pos.x + mx + mx );
                        var py = ( this.pos.y + my + my );
                        
                        var res = ig.game.collisionMap.trace( px, py, mx, my, this.size.x, this.size.y );
                        //var res = ig.game.collisionMap.trace( this.pos.x, this.pos.y, mx, my, this.size.x, this.size.y );
                        
                        console.log(res.collision.x);
                        if ( ! res.collision.x ) {
                        
                            // if the player is pushing from the left side
                            if ( ig.game.player.pos.x < this.pos.x ) {
                                this.pos.x += mx;//( 5 * ig.system.tick );
                            }
                            // else, the player is pushing from the right side
                            else if ( ig.game.player.pos.x > this.pos.x ) {
                                this.pos.x -= mx;//( 5 * ig.system.tick );
                            }
                        
                        }
                        */
                        
                        /*
                        // if entity is against a wall
                        var xPos = this.pos.x + ( this.flip ? -1 : this.size.x + 1 );
                        var yPos = ( this.pos.y + this.size.y - 1 );
                        if ( ! ig.game.collisionMap.getTile( xPos, yPos ) ) {
                            
                            // if the player is pushing from the left side
                            if ( ig.game.player.pos.x < this.pos.x ) {
                                this.pos.x += ( 5 * ig.system.tick );
                            }
                            // else, the player is pushing from the right side
                            else if ( ig.game.player.pos.x > this.pos.x ) {
                                this.pos.x -= ( 5 * ig.system.tick );
                            }
                            
                        }
                        */
                        
                        other.pushing = true;
                        var mx = ( 5 * ig.system.tick );
                        
                        // if the player is pushing from the left side
                        if ( ig.game.player.pos.x < this.pos.x ) {
                        
                            // check for a wall to the right
                            var xPos = ( this.pos.x + this.size.x + 1 );
                            var yPos = ( this.pos.y + this.size.y - 1 );
                            if ( ! ig.game.collisionMap.getTile( xPos, yPos ) ) {
                                this.pos.x += mx;
                            }
                        }
                        
                        // else, the player is pushing from the right side
                        else if ( ig.game.player.pos.x > this.pos.x ) {
                        
                            // check for a wall to the left
                            var xPos = ( this.pos.x + - 1 );
                            var yPos = ( this.pos.y + this.size.y - 1 );
                            if ( ! ig.game.collisionMap.getTile( xPos, yPos ) ) {
                                this.pos.x -= mx;
                            }
                        }
                        
                    }
                }
            }
            
        },
        
        handleMovementTrace: function( res ) {
            this.parent( res );
            if ( res.collision.x ) {
                this.flip = ( this.flip ? false : true );
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