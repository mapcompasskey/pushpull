ig.module(
    'game.entities.crate'
)
.requires(
    'impact.entity',
    'impact.entity-pool'
)
.defines(function() {
    EntityCrate = ig.Entity.extend({
        
        size: {x: 20, y: 20},
        offset: {x: 0, y: 0},
        maxVel: {x: 100, y: 100},
        friction: {x: 0, y: 0},
        accel: {x: 0, y: 0},
        flip: false,
        speed: 3,
        jump: 0,
        health: 4,
        maxHealth: 4,
        animSheet: new ig.AnimationSheet( 'media/crate.png', 20, 20 ),
        
        idling: false,
        hurting: false,
        dying: false,
        
        pushSpeed: 5,
        pushing: false,
        isPushable: true,
        
        type: ig.Entity.TYPE.B,
        checkAgainst: ig.Entity.TYPE.BOTH,
        collides: ig.Entity.COLLIDES.FIXED,
        
        init: function( x, y, settings ) {
            this.parent( x, y, settings );
            
            // add the animations
            this.addAnim( 'idle', 1, [0], true );
            this.addAnim( 'hurt', 1, [0], true );
            this.addAnim( 'dead', 1, [0], true );
            
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
            this.health = this.maxHealth;
            
            this.idling = false;
            this.hurting = false;
            this.dying = false;
        },
        
        update: function() {
        
            if ( ig.game.isPaused ) {
                return;
            }
            
            this.checkStatus();
            this.checkPosition();
            this.parent();
            
            // reset push parameters
            this.pushing = false;
            this.isPushable = true;
        },
        
        checkStatus: function() {
            
            // check entity status
            this.isHurting();
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
                        this.hurting = false;
                    }
                }
            }
            
        },
        
        // check if moving
        isMoving: function() {
            
            if ( this.hurting || this.dying ) {
                return;
            }
            
            // if being pushed
            if ( this.isPushable && this.pushing ) {
                this.vel.x = this.pushingSpeed;
            } else {
                this.vel.x = 0;
            }
            
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
            else {
                if ( this.currentAnim != this.anims.idle ) {
                    this.currentAnim = this.anims.idle.rewind();
                }
            }
            
            // update facing direction
            //this.currentAnim.flip.x = this.flip;
            
            // update entitiy opacity
            //if ( this.hurting ) {
                //this.currentAnim.alpha = 0.5;
            //}
            //else if ( this.currentAnim.alpha < 1 ) {
                //this.currentAnim.alpha = 1;
            //}
        },
        
        // check if this entity needs repositioned
        checkPosition: function() {
            
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
        
        // called when overlapping .checkAgainst entities
        collideWith: function( other, axis ) {
            
            if ( this.hurting || this.dying ) {
                return;
            }
            
            // if colliding with the player on the x-axis
            if ( this.isPushable ) {
                if ( other instanceof EntityPlayer ) {
                    if ( other.standing && axis == 'x' ) {
                    
                        // make sure they are on the same level
                        // *prevents pulling entity from continuing on if this entity gets stuck on a wall
                        if ( (other.pos.y + other.size.y) == (this.pos.y + this.size.y) ) {
                            other.collideWithPushable( this );
                        }
                        
                    }
                }
            }
            
            // if colliding with another pushable enitity
            // *doesn't work
            //if ( other.isPushable != undefined ) {
            //if ( other.collides == ig.Entity.COLLIDES.FIXED ) {
                //this.isPushable = false;
            //}
            
        },
        
        // called by pushing entity
        beingPushed: function( other ) {
            if ( this.isPushable ) {
                this.pushing = true;
                this.pushingSpeed = other.vel.x;
            }
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
            
            // stop moving
            this.vel.x = 0;
            
            // apply knockback
            //this.vel.x = ( from.flip ? -80 : 80 );
            //this.vel.y = -100;
            
            return true;
        }
        
    });
    
    ig.EntityPool.enableFor( EntityCrate );
});