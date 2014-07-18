ig.module( 
	'game.main' 
)
.requires(
    'impact.debug.debug',
	'impact.game',
	'impact.font',
    'plugins.simple-camera',
    'game.entities.player',
    'game.levels.area1'
)
.defines(function(){
    
    //
    // --------------------------------------------------------------------------
    // The Game Stage
    // --------------------------------------------------------------------------
    //
    GameStage = ig.Game.extend({
        
        clearColor: '#000',
        isPaused: false,
        tileSize: 5,
        gravity: 400,
        
        // initialize your game here
        init: function() {
            
            // bind keys
            ig.input.bind( ig.KEY.LEFT_ARROW, 'left' );
            ig.input.bind( ig.KEY.RIGHT_ARROW, 'right' );
            ig.input.bind( ig.KEY.UP_ARROW, 'up' );
            ig.input.bind( ig.KEY.DOWN_ARROW, 'down' );
            ig.input.bind( ig.KEY.X, 'jump' );
            ig.input.bind( ig.KEY.Z, 'attack' );
            ig.input.bind( ig.KEY.C, 'invincible' );
            ig.input.bind( ig.KEY.P, 'pause' );
            
            this.loadLevel( LevelArea1 );
            
            // show collision boxes
            //ig.Entity._debugShowBoxes = true;
        },
        
        update: function() {
            this.parent();
            
            if ( ig.input.pressed('pause') ) {
                this.isPaused = !this.isPaused;
            }
            
            if ( ig.game.isPaused ) {
                return;
            }
            
            // update camera
            if ( this.camera ) {
                // camera follows the player
                this.camera.follow( this.player );
            } else {
                // center screen on the player
                this.screen.x = ( this.player.pos.x - ( ig.system.width / 2 ) );
                this.screen.y = ( this.player.pos.y - ( ig.system.height / 2 ) );
            }
        },
        
        draw: function() {
            this.parent();
        },
        
        loadLevel: function( data ) {
        
            // remember the currently loaded level, so we can reload when the player dies.
            this.currentLevel = data;
            
            // call the parent implemenation. this creates the background maps and entities.
            this.parent( data );
            
            // setup camera plugin
            this.camera = new ig.SimpleCamera();
            this.camera.offset.x.min = 0;
            this.camera.offset.x.max = 0;
            this.camera.getMinMax();
            
            // spawn player
            //ig.game.spawnEntity( EntityPlayer, ( this.tileSize * 5 ), ( this.tileSize * 59 ) );
        },
        
    });
    
    
    //
    // --------------------------------------------------------------------------
    // Initialize the Game
    // --------------------------------------------------------------------------
    //
    var width = window.innerWidth;
    var height = window.innerHeight;
    ig.main( '#canvas', GameStage, 1, 200, 160, 4 );
});
