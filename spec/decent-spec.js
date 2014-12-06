describe("Testing core DecentJS functionality", function() {
	describe("gebid: Get a DOM element by its Id", function() {
		beforeEach(function(){
			affix('div[id="sample-id"][class="example-class"]');
		});

		it("should get the existing element", function() {
			expect(DecentJS.gebid('sample-id')).toExist(); 
		});

		it("should not get the nonexistent element", function() {
			expect(DecentJS.gebid('nonexistent-id')).toEqual(null); 
		});
	});
});
