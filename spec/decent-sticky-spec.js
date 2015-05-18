describe("DecentSticky: Creating and showing sticky notes.", function() {
	describe("DecentSticky.getPotentialLocations: Determining possible areas in which the sticky can reside.", function() {
		describe("when the target object is smallish", function() {
			it("returns the correct location to the top", function() {
				var result = DecentSticky.getPotentialLocations(100, 110, 110, 100, 50, 200);
				expect(result[0]).toEqual(jasmine.objectContaining({
					top: 40,
					right: 205,
					left: 5,
					bottom: 90
				}));
			});

			it("returns the correct location to the right", function() {
				var result = DecentSticky.getPotentialLocations(100, 110, 110, 100, 50, 200);
				expect(result[3]).toEqual(jasmine.objectContaining({
					top: 80,
					right: 320,
					left: 120,
					bottom: 130
				}));
			});

			it("returns the correct location to the bottom", function() {
				var result = DecentSticky.getPotentialLocations(100, 110, 110, 100, 50, 200);
				expect(result[6]).toEqual(jasmine.objectContaining({
					top: 120,
					right: 205,
					left: 5,
					bottom: 170
				}));
			});

			it("returns the correct location to the left", function() {
				var result = DecentSticky.getPotentialLocations(100, 110, 110, 100, 50, 200);
				expect(result[7]).toEqual(jasmine.objectContaining({
					top: 80,
					right: 90,
					left: -110,
					bottom: 130
				}));
			});
		});
	});
});
describe("DecentStickyLocation: Representing the locations of sticky notes.", function() {
	describe("DecentStickyLocation.overlapsWith: Determining whether two locations overlap.", function() {
		var locationA, locationB;
		describe("when the top of A overlaps the bottom of B", function() {
			beforeEach(function() {
				locationA = new DecentStickyLocation(90, 550, 250, 150);
				locationB = new DecentStickyLocation(10, 500, 110, 100);
			});

			it("notes the overlap", function() {
				expect(locationA.overlapsWith(locationB)).toEqual(true);
				expect(locationB.overlapsWith(locationA)).toEqual(true);
			});
		});

		describe("when the bottom of A overlaps the top of B", function() {
			beforeEach(function() {
				locationA = new DecentStickyLocation(10, 500, 110, 100);
				locationB = new DecentStickyLocation(90, 550, 250, 150);
			});

			it("notes the overlap", function() {
				expect(locationA.overlapsWith(locationB)).toEqual(true);
				expect(locationB.overlapsWith(locationA)).toEqual(true);
			});
		});

		describe("when the left of A overlaps the right of B", function() {
			beforeEach(function() {
				locationA = new DecentStickyLocation(150, 500, 550, 150);
				locationB = new DecentStickyLocation(100, 400, 500, 100);
			});

			it("notes the overlap", function() {
				expect(locationA.overlapsWith(locationB)).toEqual(true);
				expect(locationB.overlapsWith(locationA)).toEqual(true);
			});
		});

		describe("when the right of A overlaps the left of B", function() {
			beforeEach(function() {
				locationA = new DecentStickyLocation(100, 400, 500, 100);
				locationB = new DecentStickyLocation(150, 500, 550, 150);
			});

			it("notes the overlap", function() {
				expect(locationA.overlapsWith(locationB)).toEqual(true);
				expect(locationB.overlapsWith(locationA)).toEqual(true);
			});
		});

		describe("when A completely encloses B", function() {
			beforeEach(function() {
				locationA = new DecentStickyLocation(100, 600, 400, 300);
				locationB = new DecentStickyLocation(200, 500, 300, 400);
			});

			it("notes the overlap", function() {
				expect(locationA.overlapsWith(locationB)).toEqual(true);
				expect(locationB.overlapsWith(locationA)).toEqual(true);
			});
		});

		describe("when A completely encloses B vertically, but not horizontally", function() {
			beforeEach(function() {
				locationA = new DecentStickyLocation(100, 600, 400, 300);
				locationB = new DecentStickyLocation(200, 700, 300, 100);
			});

			it("notes the overlap", function() {
				expect(locationA.overlapsWith(locationB)).toEqual(true);
				expect(locationB.overlapsWith(locationA)).toEqual(true);
			});
		});

		describe("when A completely encloses B horizontally, but not vertically", function() {
			beforeEach(function() {
				locationA = new DecentStickyLocation(100, 600, 400, 300);
				locationB = new DecentStickyLocation(50, 500, 500, 400);
			});

			it("notes the overlap", function() {
				expect(locationA.overlapsWith(locationB)).toEqual(true);
				expect(locationB.overlapsWith(locationA)).toEqual(true);
			});
		});

		describe("when A and B exactly overlap", function() {
			beforeEach(function() {
				locationA = new DecentStickyLocation(100, 600, 400, 300);
				locationB = new DecentStickyLocation(100, 600, 400, 300);
			});

			it("notes the overlap", function() {
				expect(locationA.overlapsWith(locationB)).toEqual(true);
				expect(locationB.overlapsWith(locationA)).toEqual(true);
			});
		});

		describe("when the top of A is below the bottom of B", function() {
			beforeEach(function() {
				locationA = new DecentStickyLocation(700, 500, 1200, 100);
				locationB = new DecentStickyLocation(100, 500, 600, 100);
			});

			it("doesn't say there's an overlap", function() {
				expect(locationA.overlapsWith(locationB)).toEqual(false);
				expect(locationB.overlapsWith(locationA)).toEqual(false);
			});
		});

		describe("when the bottom of A is above the top of B", function() {
			beforeEach(function() {
				locationA = new DecentStickyLocation(100, 500, 600, 100);
				locationB = new DecentStickyLocation(700, 500, 1200, 100);
			});

			it("doesn't say there's an overlap", function() {
				expect(locationA.overlapsWith(locationB)).toEqual(false);
				expect(locationB.overlapsWith(locationA)).toEqual(false);
			});
		});

		describe("when the left of A is to the right of B", function() {
			beforeEach(function() {
				locationA = new DecentStickyLocation(100, 1200, 600, 700);
				locationB = new DecentStickyLocation(100, 600, 600, 100);
			});

			it("doesn't say there's an overlap", function() {
				expect(locationA.overlapsWith(locationB)).toEqual(false);
				expect(locationB.overlapsWith(locationA)).toEqual(false);
			});
		});

		describe("when the right of A is to the left of B", function() {
			beforeEach(function() {
				locationA = new DecentStickyLocation(100, 600, 600, 100);
				locationB = new DecentStickyLocation(100, 1200, 600, 700);
			});

			it("doesn't say there's an overlap", function() {
				expect(locationA.overlapsWith(locationB)).toEqual(false);
				expect(locationB.overlapsWith(locationA)).toEqual(false);
			});
		});
	});
});
