var MainMenu = Extend.extend (Menu, {
	title: Strings.self.gameName,
	items: [
		{label: Strings.menu.play,     element: undefined, action: function() {
			var game = Object.create (Game);
			var gameContainer = this.frameManager.pushFrame (game);
			game.init (this.frameManager, gameContainer);
		}},
		{label: Strings.menu.instruct, element: undefined, action: function(){alert("Avoid Evil Leafy.\n\nDesktop: WASD to walk, mouse to look.\n\nMobile: Drag left/right to look, hold near top to walk.")}},
		{label: Strings.menu.about, element: undefined, action: function(){alert("Hi! I'm Michael Y Huang.\n\nI made this game for my cartoon show BFDI to celebrate Halloween 2013.\n\nThis was before iOS could do WebGL, so I wrote a 2D <canvas> thing that makes a list of trapezoids from left to right, only drawing what's visible. I would not do this today.")}},
		//{label: Strings.menu.settings, element: undefined, action: function(){alert("DUH! DOY! Any modification of this game from its current state would worsen it, obviously!")}},
	],
	className: "menu main-menu",

})
