ig.module( 
	'game.main' 
)
.requires(
    'impact.debug.debug',
	'impact.game',
	'impact.font',
    'plugins.camera',
    'game.entities.player',
    'game.levels.area2'
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
        font04B03: new ig.Font( 'media/font.04b03.png' ),
        
        // initialize your game here
        init: function() {
            
            // bind keys
            ig.input.bind( ig.KEY.LEFT_ARROW, 'left' );
            ig.input.bind( ig.KEY.RIGHT_ARROW, 'right' );
            ig.input.bind( ig.KEY.UP_ARROW, 'up' );
            ig.input.bind( ig.KEY.DOWN_ARROW, 'down' );
            ig.input.bind( ig.KEY.Z, 'attack' );
            ig.input.bind( ig.KEY.X, 'action' );
            ig.input.bind( ig.KEY.C, 'jump' );
            ig.input.bind( ig.KEY.I, 'invincible' );
            ig.input.bind( ig.KEY.P, 'pause' );
            
            //this.loadLevel( LevelArea1 );
            this.loadLevel( LevelArea2 );
            
            // show collision boxes
            ig.Entity._debugShowBoxes = true;
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
            if ( this.camera && this.player ) {
                this.camera.follow( this.player );
            }
            
        },
        
        draw: function() {
            this.parent();
            
            // draw help text
            //this.font04B03.draw( 'Z: Attack | X: Grab | C: Jump', 2, 2, ig.Font.ALIGN.LEFT );
        },
        
        loadLevel: function( data ) {
        
            // remember the currently loaded level, so we can reload when the player dies.
            this.currentLevel = data;
            
            // call the parent implemenation. this creates the background maps and entities.
            this.parent( data );
            
            // setup camera plugin
            this.camera = new ig.Camera();
            
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
