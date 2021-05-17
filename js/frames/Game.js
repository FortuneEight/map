var Game = {
    frameManager: undefined,
    frameContainer: undefined,
    graphics: undefined,
    state: undefined,

    stepInterval: undefined,
    framesSincePointerLock: 0,

    clickListener: undefined,
    pointerLockChangeListener: undefined,
    mouseMoveListener: undefined,

    touchStartListener: undefined,
    touchMoveListener: undefined,
    touchEndListener: undefined,

    dataDic: [],
    count: 0,

    keysDown: {
        left: false,
        right: false,
        forward: false,
        backward: false
    },
    forwardness: 0,

    init: function(frameManager, frameContainer) {
        this.frameManager = frameManager;
        this.frameContainer = frameContainer;

        this.state = Object.create(GameState);
        this.state.init();

        // Set up canvas and graphics
        var displayCanvas = document.createElement("canvas");
        this.frameContainer.appendChild(displayCanvas);
        this.graphics = Object.create(Graphics);
        this.graphics.init(displayCanvas, this.state);

        this.start();
    },

    keyIdDown: function(keyId) {
        switch (keyId) {
            case KeyId.left:
                this.keysDown.left = true;
                break;
            case KeyId.right:
                this.keysDown.right = true;
                break;
            case KeyId.forward:
                this.keysDown.forward = true;
                break;
            case KeyId.backward:
                this.keysDown.backward = true;
                break;
                /*case KeyId.menu:
                	var pauseMenu = Object.create (PauseMenu);
                	var pauseMenuContainer = this.frameManager.pushFrame (pauseMenu);
                	pauseMenu.init (this.frameManager, pauseMenuContainer);
                	this.frameManager*/
        }
    },
    keyIdUp: function(keyId) {
        switch (keyId) {
            case KeyId.left:
                this.keysDown.left = false;
                break;
            case KeyId.right:
                this.keysDown.right = false;
                break;
            case KeyId.forward:
                this.keysDown.forward = false;
                break;
            case KeyId.backward:
                this.keysDown.backward = false;
                break;
        }
    },

    start: function() {
        this.clickListener = this.requestPointerLock.bind(this);
        this.pointerLockChangeListener = this.pointerLockChange.bind(this);
        this.mouseMoveListener = this.mouseMove.bind(this);

        this.touchStartListener = this.touchStart.bind(this);
        this.touchMoveListener = this.touchMove.bind(this);
        this.touchEndListener = this.touchEnd.bind(this);

        this.focus();
    },

    focus: function() {
        var hasPointerLock = this.requestPointerLock();
        this.graphics.startRendering();
        this.stepInterval = window.setInterval(this.step.bind(this), 1000 / Settings.game.updateRate);
        this.attachEventHandlers(hasPointerLock);
    },
    defocus: function() {
        this.graphics.stopRendering();
        window.clearInterval(this.stepInterval);
        this.framesSincePointerLock = 0;
        this.detachEventHandlers();
    },
    quit: function() {
        this.defocus();
        this.frameManager.popFrame();
    },

    attachEventHandlers: function(hasPointerLock) {
        if (hasPointerLock) {
            this.frameContainer.addEventListener("click", this.clickListener, false);
            document.addEventListener("pointerlockchange", this.pointerLockChangeListener, false);
            this.frameContainer.addEventListener("mousemove", this.mouseMoveListener, false);
            return;
        }

        // NEW TOUCH BIZ!
        this.frameContainer.addEventListener("touchstart", this.touchStartListener, false);
        this.frameContainer.addEventListener("touchmove", this.touchMoveListener, false);
        this.frameContainer.addEventListener("touchend", this.touchEndListener, false);
    },
    detachEventHandlers: function() {
        this.frameContainer.removeEventListener("click", this.clickListener, false);
        document.removeEventListener("pointerlockchange", this.pointerLockChangeListener, false);
        this.frameContainer.removeEventListener("mousemove", this.mouseMoveListener, false);

        this.frameContainer.removeEventListener("touchstart", this.touchStartListener, false);
        this.frameContainer.removeEventListener("touchmove", this.touchMoveListener, false);
        this.frameContainer.removeEventListener("touchend", this.touchEndListener, false);
    },
    touchStart: function(e) {
        e.preventDefault();
        var touch = e.changedTouches[0];
        this.ptx = touch.screenX;
        this.pty = touch.screenY;
    },
    touchMove: function(e) {
        e.preventDefault();
        var touch = e.changedTouches[0];
        var dx = touch.screenX - this.ptx;
        this.state.player.turn(dx * Settings.controls.mouseSensitivity * 3.);

        this.forwardness = (touch.screenY / window.innerHeight) * -2 + 1;
        this.forwardness *= 2;
        this.forwardness = Math.max(-1, Math.min(1, this.forwardness));

        this.ptx = touch.screenX;
        this.pty = touch.screenY;
    },
    touchEnd: function(e) {
        this.forwardness = 0;
    },

    step: function() {
        if (this.state.player.alive) {
            this.state.player.applyKeys(this.keysDown, this.forwardness);
            this.state.player.applyVelocity();
            this.state.player.applyFriction(Settings.player.friction);
            WallSolver.solve(this.state.player, this.state.map);
            posis = []
            posis.push(this.state.player.x)
            posis.push(this.state.player.y)
            posis.push(this.state.petal.tx)
            posis.push(this.state.petal.ty)
            this.dataDic.push(posis)
            if (this.state.timer % Settings.petal.boomFrames == 0) {
                this.state.petal.takeStep(this.state.map, this.state.player.x, this.state.player.y);
                console.clear();
                console.log("Your location:");
                console.log("  x: " + Math.floor(this.state.player.x));
                console.log("  y: " + Math.floor(this.state.player.y));
                console.log("Petal's location:");
                console.log("  x: " + Math.floor(this.state.petal.tx));
                console.log("  y: " + Math.floor(this.state.petal.ty));
            }
            if (Math.floor(this.state.player.x) == this.state.petal.tx && Math.floor(this.state.player.y) == this.state.petal.ty) {
                this.state.player.alive = false;
                this.state.deathTime = this.state.timer;
                this.detachEventHandlers();
                console.log("You died!");
                let csvContent = "data:text/csv;charset=utf-8," + this.dataDic.map(e => e.join(",")).join("\n");
                var encodedUri = encodeURI(csvContent);
                window.open(encodedUri);
            }
        } else {
            var angleFromPlayerToPetal = Math.atan2((this.state.petal.ty + 0.5) - this.state.player.y, (this.state.petal.tx + 0.5) - this.state.player.x);
            this.state.player.turn(0.1 * (angleFromPlayerToPetal - this.state.player.angle));

            if (this.state.timer - this.state.deathTime == Settings.game.framesToShowDeathScreen) {
                this.exitPointerLock();
                this.showDeathMenu();
            }
        }

        this.state.timer++;
        this.framesSincePointerLock++;
    },

    requestPointerLock: function() {
        if (!this.frameContainer.requestPointerLock) {
            return false;
        }
        this.frameContainer.requestPointerLock();
        return true;
    },
    exitPointerLock: function() {
        if (document.exitPointerLock) {
            document.exitPointerLock();
        }
    },
    pointerLockChange: function(e) {
        console.log(e);
        var pointerLockElement = document.pointerLockElement ||
            document.mozPointerLockElement ||
            document.webkitPointerLockElement;
        //if (!!pointerLockElement) { // Is there already a pointer lock element?
        if (pointerLockElement === this.frameContainer) {

        } else { // There is not; we just exited pointer lock
            if (this.state.player.alive) {
                this.showPauseMenu();
            }
        }
    },
    showPauseMenu: function() {
        var pauseMenu = Object.create(PauseMenu);
        var pauseMenuContainer = this.frameManager.pushFrame(pauseMenu);
        pauseMenu.init(this.frameManager, pauseMenuContainer);
    },
    showDeathMenu: function() {
        var deathMenu = Object.create(DeathMenu);
        var deathMenuContainer = this.frameManager.pushFrame(deathMenu);
        deathMenu.init(this.frameManager, deathMenuContainer, this.state.deathTime);
    },
    mouseMove: function(e) {
        var dx = e.movementX ||
            e.mozMovementX ||
            e.webkitMovementX ||
            0,
            dy = e.movementY ||
            e.mozMovementY ||
            e.webkitMovementY ||
            0;
        if (this.framesSincePointerLock > 1) { // A very large mouse movement is reported after a pointer lock
            this.state.player.turn(dx * Settings.controls.mouseSensitivity);
        }
    }
};