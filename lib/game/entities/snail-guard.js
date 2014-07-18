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
        flip: false,
        speed: 3,
        jump: 220,
        health: 4,
        maxHealth: 4,
        animSheet: new ig.AnimationSheet( 'media/snail-guard.png', 44, 44 ),
        
        proximity: 80,
        alpha: 1.0,
        hurtTime: 5,
        hurtTimer: null,
        actionTimer: null,
        
        idling: false,
        hurting: false,
        dying: false,
        peeking: false,
        jumping: false,
        falling: false,
        attacking: false,
        
        type: ig.Entity.TYPE.B,
        checkAgainst: ig.Entity.TYPE.A,
        //collides: ig.Entity.COLLIDES.PASSIVE,
        collides: ig.Entity.COLLIDES.FIXED,
        
        init: function( x, y, settings ) {
            this.parent( x, ( y - this.size.y ), settings );
            
            // add the animations
            this.addAnim( 'idle', 1, [0], true );
            this.addAnim( 'walk', 0.6, [0, 1] );
            this.addAnim( 'crouch', 1, [0], true );
            this.addAnim( 'jump', 1, [0], true );
            this.addAnim( 'fall', 1, [0], true );
            this.addAnim( 'hurt', 0.1, [2, 2, 0, 0, 0, 2, 3, 4], true );
            this.addAnim( 'peek', 0.2, [3, 3, 4], true );
            this.addAnim( 'dead', 0.2, [0, 0, 0], true );
            
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
            this.peeking = false;
            this.dying = false;
            this.jumping = false;
            this.falling = false;
            this.attacking = false;
            
            // set entity action
            this.updateAction();
        },
        
        update: function() {
        
            if ( ig.game.isPaused ) {
                return;
            }
            
            this.checkStatus();
            this.checkPosition();
            this.parent();
        },
        
        checkStatus: function() {
            /*
            if ( ig.game.player ) {
                
                // if the player is within range, move towards the player
                var distance = this.distanceTo( ig.game.player );
                if ( distance < this.proximity ) {
                    this.attacking = true;
                }
                // else, if the player is now outside the range, move towards the starting position
                else if ( this.attacking ) {
                    this.moveToPoint.setDestination( this.start );
                    this.attacking = false;
                }
            }
            */
            
            // if action timer ended
            if ( this.actionTimer ) {
                if ( this.actionTimer.delta() > 0 ) {
                    this.updateAction();
                }
            }
            
            // check entity status
            this.isHurting();
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
            
            // if hurt timer ended
            if ( this.hurting ) {
                if ( this.hurtTimer ) {
                    
                    if ( this.hurtTimer.delta() < -(this.hurtTime - 0.2) ) {
                        this.alpha = 0.5;
                    } else {
                        this.alpha = 1.0;
                    }
                    
                    if ( this.hurtTimer.delta() > -2.0 ) {
                        this.peeking = true;
                    }
                    if ( this.hurtTimer.delta() > 0 ) {
                        this.alpha = 1.0;
                        this.hurting = false;
                        this.peeking = false;
                    }
                }
            }
            
            /*
            // stop hurting when the animation ends
            if ( this.hurting ) {
                if ( this.currentAnim == this.anims.hurt ) {
                    if ( this.currentAnim.loopCount ) {
                        this.hurting = false;
                        this.updateCollisionBox();
                    }
                }
            }
            */
            
            /*
            // stop hurting when the entity lands
            if ( this.hurting ) {
                if ( this.currentAnim == this.anims.hurt ) {
                    if ( this.standing ) {
                        this.hurting = false;
                        this.updateCollisionBox();
                    }
                }
            }
            */
            
        },
        
        // check if attacking
        isAttacking: function() {
        
            if ( this.hurting || this.dying ) {
                return;
            }
            
        },
        
        // check if jumping
        isJumping: function() {
            
            if ( this.hurting || this.dying || this.crouching ) {
                this.jumping = false;
                this.falling = false;
                return;
            }
            
            /*
            // if standing on something and just pressed "JUMP" button
            if ( this.standing && ig.input.pressed('jump') ) {
                this.jumping = true;
                this.vel.y = -this.jump;
                this.updateCollisionBox();
                return;
            }
            */
            
            // if falling
            if ( this.vel.y > 0 && ! this.standing ) {
                this.falling = true;
                this.updateCollisionBox();
                return;
            }
            
            // if standing on something while jumping/falling
            if ( ( this.jumping || this.falling ) && this.standing ) {
                this.jumping = false;
                this.falling = false;
                this.updateCollisionBox();
            }
            
        },
        
        // check if moving
        isMoving: function() {
            
            if ( this.hurting || this.dying ) {
                return;
            }
            
            if ( this.walking ) {
                this.vel.x = this.speed * ( this.flip ? -1 : 1 );
            } else {
                this.vel.x = 0;
            }
            
        },
        
        // update entity animation
        animate: function() {
            
            // update entitiy opacity
            this.currentAnim.alpha = this.alpha;
            
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
        
        // update the size of the collision box
        updateCollisionBox: function() {
            /*
            if ( this.jumping || this.falling ) {
                this.size = {x: 6, y: 5};
                this.offset = {x: 5, y: 9};
            } else {
                this.size = this.sizeReset
                this.offset = this.offsetReset;
            }
            */
        },
                
        // update entity action
        updateAction: function() {
            
            if ( this.hurting || this.dying ) {
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
            
            if ( this.hurting || this.dying ) {
                return;
            }
            
            other.receiveDamage( 1, this );
        },
        
        // called by attacking entity
        receiveDamage: function( amount, from ) {
        
            if ( this.hurting || this.dying ) {
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
            this.hurtTimer = new ig.Timer(this.hurtTime);
            
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