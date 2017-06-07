import { assert } from "chai";
import * as Units from "../../src/measure/units";
import * as Unit from "../../src/measure/unit";
import * as Amount from "../../src/measure/amount";
import * as PropertyValue from "../../src/product-properties/property-value";

describe("units_test", () => {

  describe("getQuantityTypeFromString", () => {

		/*it('should not be case sensitive', () => {
			let length1 = Units.getQuantityTypeFromString("Length");
			let length2 = Units.getQuantityTypeFromString("length");
			assert.isTrue(length1 === length2);
		});*/

    /*it('getUnitsForQuantityshould not be case sensitive', () => {
      const unit = Units.getUnitsForQuantity("Length")[0];
      assert.isTrue(unit === Units.Meter);
    });*/

    /*it('Base should be eUnits not be case sensitive', () => {
     const unit = Units.getUnitsForQuantity("Length")[0];
     Units.Ampere
     assert.isTrue(unit === Units.Meter);
     });*/

  });

  describe("equals", () => {
    it("Base unit One should be equal", () => {
      const unit = Units.One;
      const unit2 = Units.getUnitFromString("One");
      assert.isTrue(Unit.equals(unit, unit2));
    });

    it("Alternate unit Radian should be equal", () => {
      const unit = Units.Radian;
      const unit2 = Units.getUnitFromString("Radian");
      assert.isTrue(Unit.equals(unit, unit2));
    });

    it("Alternate unit compare different object references", () => {
      const unit1 = JSON.parse("{\"quantity\":\"Power\",\"type\":\"alternate\",\"symbol\":\"W\",\"parent\":{\"quantity\":\"Power\",\"type\":\"product\",\"elements\":[{\"unit\":{\"quantity\":\"Energy\",\"type\":\"alternate\",\"symbol\":\"J\",\"parent\":{\"quantity\":\"Energy\",\"type\":\"product\",\"elements\":[{\"unit\":{\"quantity\":\"Force\",\"type\":\"alternate\",\"symbol\":\"N\",\"parent\":{\"quantity\":\"Force\",\"type\":\"product\",\"elements\":[{\"unit\":{\"quantity\":\"Mass\",\"type\":\"base\",\"symbol\":\"kg\"},\"pow\":1},{\"unit\":{\"quantity\":\"Length\",\"type\":\"base\",\"symbol\":\"m\"},\"pow\":1},{\"unit\":{\"quantity\":\"Duration\",\"type\":\"base\",\"symbol\":\"s\"},\"pow\":-2}]}},\"pow\":1},{\"unit\":{\"quantity\":\"Length\",\"type\":\"base\",\"symbol\":\"m\"},\"pow\":1}]}},\"pow\":1},{\"unit\":{\"quantity\":\"Duration\",\"type\":\"base\",\"symbol\":\"s\"},\"pow\":-1}]}}");
      const unit2 = JSON.parse("{\"quantity\":\"Power\",\"type\":\"alternate\",\"symbol\":\"W\",\"parent\":{\"quantity\":\"Power\",\"type\":\"product\",\"elements\":[{\"unit\":{\"quantity\":\"Energy\",\"type\":\"alternate\",\"symbol\":\"J\",\"parent\":{\"quantity\":\"Energy\",\"type\":\"product\",\"elements\":[{\"unit\":{\"quantity\":\"Force\",\"type\":\"alternate\",\"symbol\":\"N\",\"parent\":{\"quantity\":\"Force\",\"type\":\"product\",\"elements\":[{\"unit\":{\"quantity\":\"Mass\",\"type\":\"base\",\"symbol\":\"kg\"},\"pow\":1},{\"unit\":{\"quantity\":\"Length\",\"type\":\"base\",\"symbol\":\"m\"},\"pow\":1},{\"unit\":{\"quantity\":\"Duration\",\"type\":\"base\",\"symbol\":\"s\"},\"pow\":-2}]}},\"pow\":1},{\"unit\":{\"quantity\":\"Length\",\"type\":\"base\",\"symbol\":\"m\"},\"pow\":1}]}},\"pow\":1},{\"unit\":{\"quantity\":\"Duration\",\"type\":\"base\",\"symbol\":\"s\"},\"pow\":-1}]}}");

      assert.isTrue(Unit.equals(unit1, unit2));
    });

    it("Product unit should be equal", () => {
      const unit = Unit.divide("Length", Units.Meter, Units.CentiMeter);
      const unit2 = Unit.divide("Length", Units.Meter, Units.CentiMeter);
      assert.isTrue(Unit.equals(unit, unit2));
    });

    it("Product unit should not be equal", () => {
      const unit = Unit.divide("Length", Units.Meter, Units.CentiMeter);
      const unit2 = Unit.divide("Length", Units.Meter, Units.Millimeter);
      assert.isFalse(Unit.equals(unit, unit2));
    });
  });

});
