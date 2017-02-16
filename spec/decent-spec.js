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

  describe("hasClass: Determine whether a DOM element has a given class.", function() {
    var theSubject = function() {
      return DecentJS.hasClass(theElement, theClass);
    }, theElement = null, theClass;

    describe("when the element class contains a hyphenated string class with a substring containing the searched-for term", function() {
      describe("when the class is at the beginning", function() {
        beforeEach(function(){
          theElement = affix('div[class="reload-on-close another-class"]').get(0);
        });

        describe("when searched-for class contains a hyphen", function() {
          beforeEach(function(){
            theClass = 'on-close';
          });

          it("doesn't find the class", function() {
            expect(theSubject()).not.toBeTruthy();
          });
        });

        describe("when searched-for class doesn't contain a hyphen", function() {
          beforeEach(function(){
            theClass = 'close';
          });

          it("doesn't find the class", function() {
            expect(theSubject()).not.toBeTruthy();
          });
        });
      });

      describe("when the class is at the end", function() {
        beforeEach(function(){
          theElement = affix('div[class="one-class reload-on-close"]').get(0);
        });

        describe("when searched-for class contains a hyphen", function() {
          beforeEach(function(){
            theClass = 'on-close';
          });

          it("doesn't find the class", function() {
            expect(theSubject()).not.toBeTruthy();
          });
        });

        describe("when searched-for class doesn't contain a hyphen", function() {
          beforeEach(function(){
            theClass = 'close';
          });

          it("doesn't find the class", function() {
            expect(theSubject()).not.toBeTruthy();
          });
        });
      });

      describe("when the class is in the middle", function() {
        beforeEach(function(){
          theElement = affix('div[class="one-class reload-on-close another-class"]').get(0);
        });

        describe("when searched-for class contains a hyphen", function() {
          beforeEach(function(){
            theClass = 'on-close';
          });

          it("doesn't find the class", function() {
            expect(theSubject()).not.toBeTruthy();
          });
        });

        describe("when searched-for class doesn't contain a hyphen", function() {
          beforeEach(function(){
            theClass = 'close';
          });

          it("doesn't find the class", function() {
            expect(theSubject()).not.toBeTruthy();
          });
        });
      });

      describe("when the class is by itself", function() {
        beforeEach(function(){
          theElement = affix('div[class="reload-on-close"]').get(0);
        });

        describe("when searched-for class contains a hyphen", function() {
          beforeEach(function(){
            theClass = 'on-close';
          });

          it("doesn't find the class", function() {
            expect(theSubject()).not.toBeTruthy();
          });
        });

        describe("when searched-for class doesn't contain a hyphen", function() {
          beforeEach(function(){
            theClass = 'close';
          });

          it("doesn't find the class", function() {
            expect(theSubject()).not.toBeTruthy();
          });
        });
      });
    });

    describe("when the element class contains a searched-for class", function() {
      describe("when the class is at the beginning", function() {
        describe("when searched-for class contains a hyphen", function() {
          beforeEach(function(){
            theElement = affix('div[class="reload-on-close another-class"]').get(0);
            theClass = 'reload-on-close';
          });

          it("finds the class", function() {
            expect(theSubject()).toBeTruthy();
          });
        });

        describe("when searched-for class doesn't contain a hyphen", function() {
          beforeEach(function(){
            theElement = affix('div[class="close another-class"]').get(0);
            theClass = 'close';
          });

          it("finds the class", function() {
            expect(theSubject()).toBeTruthy();
          });
        });
      });

      describe("when the class is at the end", function() {
        describe("when searched-for class contains a hyphen", function() {
          beforeEach(function(){
            theElement = affix('div[class="one-class reload-on-close"]').get(0);
            theClass = 'reload-on-close';
          });

          it("finds the class", function() {
            expect(theSubject()).toBeTruthy();
          });
        });

        describe("when searched-for class doesn't contain a hyphen", function() {
          beforeEach(function(){
            theElement = affix('div[class="one-class close"]').get(0);
            theClass = 'close';
          });

          it("finds the class", function() {
            expect(theSubject()).toBeTruthy();
          });
        });
      });

      describe("when the class is in the middle", function() {
        describe("when searched-for class contains a hyphen", function() {
          beforeEach(function(){
            theElement = affix('div[class="one-class reload-on-close another-class"]').get(0);
            theClass = 'reload-on-close';
          });

          it("finds the class", function() {
            expect(theSubject()).toBeTruthy();
          });
        });

        describe("when searched-for class doesn't contain a hyphen", function() {
          beforeEach(function(){
            theElement = affix('div[class="one-class close another-class"]').get(0);
            theClass = 'close';
          });

          it("finds the class", function() {
            expect(theSubject()).toBeTruthy();
          });
        });
      });

      describe("when the class is by itself", function() {
        describe("when searched-for class contains a hyphen", function() {
          beforeEach(function(){
            theElement = affix('div[class="reload-on-close"]').get(0);
            theClass = 'reload-on-close';
          });

          it("finds the class", function() {
            expect(theSubject()).toBeTruthy();
          });
        });

        describe("when searched-for class doesn't contain a hyphen", function() {
          beforeEach(function(){
            theElement = affix('div[class="close"]').get(0);
            theClass = 'close';
          });

          it("finds the class", function() {
            expect(theSubject()).toBeTruthy();
          });
        });
      });
    });
  });

  describe("insideMatchingElement: Determine whether one element is inside another", function() {
    var theSubject = function() {
      return DecentJS.insideMatchingElement(theElement, theProperties);
    },
    theAncestor = null,
    theElement = null,
    theProperties = {};

    describe("when determining by the class of the parent", function() {
      beforeEach(function(){
        theProperties = {class: 'i-am-parent-class'};
        var parentEl = affix('div[class="i-am-parent-class"]');
        theAncestor = parentEl.get(0);
        theElement = parentEl.affix('p[class="zee-paragraph"] a[href="/click/here"]').get(0);
      });

      it("returns the ancestor", function() {
        expect(theSubject()).toEqual(theAncestor);
      });
    });
  });
});
