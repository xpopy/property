import { useState } from "react";
import { Unit, UnitFormat } from "uom";
import { PropertyValueSet, PropertyValue, PropertyFilter } from "@promaster-sdk/property";
import * as PropertyFiltering from "@promaster-sdk/property-filter-pretty";
import { exhaustiveCheck } from "@promaster-sdk/property/lib/utils/exhaustive-check";
import { DiscretePropertySelectorOptions, GetItemFilter, GetItemValue } from "../discrete";
import { UseAmountPropertySelectorOptions } from "../amount";
import { UseTextboxPropertySelectorOptions } from "../textbox";

export type UsePropertiesSelectorOptions<TItem> = {
  // Required inputs
  readonly productProperties: ReadonlyArray<UsePropertiesSelectorProperty<TItem>>;
  readonly selectedProperties: PropertyValueSet.PropertyValueSet;

  // Used to print error messages
  readonly filterPrettyPrint?: PropertyFiltering.FilterPrettyPrint;

  // Get an item that corresponds to a property value of undefined
  readonly getUndefinedValueItem: () => TItem;
  readonly getItemValue: GetItemValue<TItem>;
  readonly getItemFilter: GetItemFilter<TItem>;

  // Includes the raw property name and value in paranthesis
  readonly showCodes?: boolean;
  // Will render properties that according to their rule should be hidden
  readonly includeHiddenProperties?: boolean;
  // Will automatically select values for properties that have only one valid value
  readonly autoSelectSingleValidValue?: boolean;
  // Locks fields with single valid value
  readonly lockSingleValidValue?: boolean;

  // Events
  readonly onChange?: UsePropertiesSelectorOnPropertiesChanged;
  readonly onPropertyFormatChanged?: (propertyName: string, unit: Unit.Unit<unknown>, decimalCount: number) => void;
  readonly onPropertyFormatCleared?: (propertyName: string) => void;

  // Translations
  readonly valueMustBeNumericMessage?: string;
  readonly valueIsRequiredMessage?: string;

  // Specifies property names of properties that should be read-only
  readonly readOnlyProperties?: ReadonlyArray<string>;
  // Specifies property names of properties that should be optional (only for amounts for now)
  readonly optionalProperties?: ReadonlyArray<string>;
  // Specifies input format per property name for entering amount properties (measure unit and decimal count)
  readonly propertyFormats?: {
    readonly [key: string]: UsePropertiesSelectorAmountFormat;
  };

  // Debounce value for inputs in ms. Defaults to 350.
  readonly inputDebounceTime?: number;

  // Group handling
  readonly initiallyClosedGroups?: ReadonlyArray<string>;

  // Use customUnits
  readonly unitsFormat: {
    readonly [key: string]: UnitFormat.UnitFormat;
  };
  readonly units: Unit.UnitMap;
  readonly unitLookup: Unit.UnitLookup;

  // Comparer
  readonly comparer?: PropertyValue.Comparer;

  readonly sortValidFirst?: boolean;
};

export type UsePropertiesSelectorProperty<TItem> = {
  readonly fieldName?: string;
  readonly sortNo: number;
  readonly name: string;
  readonly group: string;
  readonly quantity: string;
  readonly validationFilter: PropertyFilter.PropertyFilter;
  readonly visibilityFilter: PropertyFilter.PropertyFilter;
  readonly valueItems: ReadonlyArray<TItem>;
};

export type UsePropertiesSelectorAmountFormat = {
  readonly unit: Unit.Unit<unknown>;
  readonly decimalCount: number;
};

export type UsePropertiesSelector<TItem> = {
  readonly groups: ReadonlyArray<UsePropertiesSelectorGroup<TItem>>;
};

export type UsePropertiesSelectorGroup<TItem> = {
  readonly name: string;
  readonly isClosed: boolean;
  readonly selectors: ReadonlyArray<SelectorRenderInfo<TItem>>;
  readonly getGroupToggleButtonProps: () => React.SelectHTMLAttributes<HTMLButtonElement>;
};

export type UsePropertiesSelectorOnPropertiesChanged = (
  properties: PropertyValueSet.PropertyValueSet,
  propertyNames: ReadonlyArray<string>
) => void;

export type SelectorRenderInfoBase = {
  readonly propertyName: string;
  readonly isValid: boolean;
  // If includeHiddenProperties was specified, the selector may have been rendered even if it is supposed to be hidden
  // This flag tells if is was supposed to be hidden
  readonly isHidden: boolean;
  // Used to add code if includeCodes is true
  readonly getPropertyLabel: (propertyText: string) => string;
};

type SelectorRenderInfoBaseInternal = SelectorRenderInfoBase & {
  readonly groupName: string;
};

type SelectorRenderInfoInternal<TItem> = SelectorRenderInfo<TItem> & {
  readonly groupName: string;
};

export type SelectorRenderInfo<TItem> =
  | ({
      readonly type: "Discrete";
      readonly getUseDiscreteOptions: () => DiscretePropertySelectorOptions<TItem>;
    } & SelectorRenderInfoBase)
  | ({
      readonly type: "AmountField";
      readonly getUseAmountOptions: () => UseAmountPropertySelectorOptions;
    } & SelectorRenderInfoBase)
  | ({
      readonly type: "TextBox";
      readonly getUseTextboxOptions: () => UseTextboxPropertySelectorOptions;
    } & SelectorRenderInfoBase);

export type UsePropertiesSelectorPropertySelectorType<TItem> = SelectorRenderInfo<TItem>["type"];

export function usePropertiesSelector<TItem>(
  options: UsePropertiesSelectorOptions<TItem>
): UsePropertiesSelector<TItem> {
  const requiredOptions = optionsWithDefaults(options);

  const { productProperties, selectedProperties, includeHiddenProperties, comparer } = requiredOptions;

  const sortedArray = productProperties
    .slice()
    .sort((a, b) => (a.sortNo < b.sortNo ? -1 : a.sortNo > b.sortNo ? 1 : 0));

  const allSelectors: ReadonlyArray<SelectorRenderInfoInternal<TItem>> = sortedArray
    .filter(
      (property) =>
        includeHiddenProperties || PropertyFilter.isValid(selectedProperties, property.visibilityFilter, comparer)
    )
    .map((p) => createSelector(p, requiredOptions));

  const [closedGroups, setClosedGroups] = useState<ReadonlyArray<string>>(requiredOptions.initiallyClosedGroups);

  return {
    groups: getDistinctGroupNames(allSelectors).map((name) => {
      const isClosed = closedGroups.indexOf(name) !== -1;
      const selectors = allSelectors.filter((selector) => selector.groupName === (name || ""));
      return {
        name,
        isClosed,
        getGroupToggleButtonProps: () => ({
          onClick: () =>
            setClosedGroups(
              closedGroups.indexOf(name) >= 0 ? closedGroups.filter((g) => g !== name) : [...closedGroups, name]
            ),
        }),
        selectors,
      };
    }),
  };
}

function createSelector<TItem>(
  property: UsePropertiesSelectorProperty<TItem>,
  params: Required<UsePropertiesSelectorOptions<TItem>>
): SelectorRenderInfoInternal<TItem> {
  const {
    selectedProperties,
    propertyFormats,
    comparer,
    productProperties,
    autoSelectSingleValidValue,
    showCodes,
    inputDebounceTime,
    valueMustBeNumericMessage,
    valueIsRequiredMessage,
    onChange,
    optionalProperties,
    filterPrettyPrint,
    units,
    unitsFormat,
    onPropertyFormatChanged,
    onPropertyFormatCleared,
    lockSingleValidValue,
    readOnlyProperties,
    sortValidFirst,
    getUndefinedValueItem,
    getItemValue,
    getItemFilter,
  } = params;

  const selectedItemValue = PropertyValueSet.getValue(property.name, selectedProperties);
  const selectedItem =
    property.valueItems &&
    property.valueItems.find((item) => {
      const itemValue = getItemValue(item);
      return (
        (itemValue === undefined && selectedItemValue === undefined) ||
        (itemValue && PropertyValue.equals(selectedItemValue, itemValue, comparer))
      );
    });

  const defaultFormat = getDefaultFormat(property, selectedItemValue);
  const isValid = getIsValid(property, selectedItem, selectedProperties, comparer, getItemFilter);

  // TODO: Better handling of format to use when the format is missing in the map
  const propertyFormat = propertyFormats[property.name] || defaultFormat;

  const isHidden = !PropertyFilter.isValid(selectedProperties, property.visibilityFilter, comparer);
  // const label = translatePropertyName(property.name) + (includeCodes ? " (" + property.name + ")" : "");
  // const labelHover = translatePropertyLabelHover(property.name);

  const myBase: SelectorRenderInfoBaseInternal = {
    propertyName: property.name,
    groupName: property.group,
    isValid,
    isHidden,
    getPropertyLabel: (propertyText) => propertyText + (showCodes ? " (" + property.name + ")" : ""),
  };

  const readOnly = readOnlyProperties.indexOf(property.name) !== -1;
  const propertyOnChange = handleChange(
    onChange,
    productProperties,
    autoSelectSingleValidValue,
    comparer,
    getItemValue,
    getItemFilter
  );
  const fieldName = property.fieldName || property.name;
  const propertyName = property.name;
  const validationFilter = property.validationFilter;
  const valueItems = property.valueItems;
  const locked =
    autoSelectSingleValidValue || lockSingleValidValue
      ? shouldBeLocked(selectedItem, property, selectedProperties, comparer, getItemFilter)
      : false;

  function onValueChange(newValue: PropertyValue.PropertyValue): void {
    propertyOnChange(
      newValue
        ? PropertyValueSet.set(propertyName, newValue, selectedProperties)
        : PropertyValueSet.removeProperty(propertyName, selectedProperties),
      propertyName
    );
  }

  const selectorType = getSelectorType(property);
  switch (selectorType) {
    case "TextBox": {
      return {
        ...myBase,
        type: "TextBox",
        getUseTextboxOptions: () => ({
          propertyName,
          propertyValueSet: selectedProperties,
          readOnly,
          onValueChange,
          debounceTime: inputDebounceTime,
        }),
      };
    }
    case "AmountField": {
      return {
        ...myBase,
        type: "AmountField",
        getUseAmountOptions: () => ({
          propertyName,
          propertyValueSet: selectedProperties,
          inputUnit: propertyFormat.unit,
          inputDecimalCount: propertyFormat.decimalCount,
          onFormatChanged: (unit: Unit.Unit<unknown>, decimalCount: number) =>
            onPropertyFormatChanged(propertyName, unit, decimalCount),
          onFormatCleared: () => onPropertyFormatCleared(propertyName),
          onValueChange,
          notNumericMessage: valueMustBeNumericMessage,
          fieldName: fieldName,
          // If it is optional then use blank required message
          isRequiredMessage:
            optionalProperties && optionalProperties.indexOf(propertyName) !== -1 ? "" : valueIsRequiredMessage,
          validationFilter,
          filterPrettyPrint,
          readOnly: readOnly,
          debounceTime: inputDebounceTime,
          unitsFormat,
          units,
        }),
      };
    }
    case "Discrete":
      return {
        ...myBase,
        type: "Discrete",
        getUseDiscreteOptions: () => ({
          getUndefinedValueItem,
          getItemValue,
          getItemFilter,
          sortValidFirst,
          propertyName,
          propertyValueSet: selectedProperties,
          valueItems,
          showCodes: showCodes,
          filterPrettyPrint,
          onValueChange,
          disabled: readOnly || locked,
        }),
      };
    default:
      return exhaustiveCheck(selectorType, true);
  }
}

function getDefaultFormat<TItem>(
  property: UsePropertiesSelectorProperty<TItem>,
  selectedValue: PropertyValue.PropertyValue
): UsePropertiesSelectorAmountFormat {
  const defaultFormat: UsePropertiesSelectorAmountFormat = { unit: Unit.One, decimalCount: 2 };
  const propertyType = getPropertyType(property.quantity);
  switch (propertyType) {
    case "text":
    case "integer":
      return defaultFormat;
    case "amount":
      return selectedValue && selectedValue.type === "amount"
        ? {
            unit: selectedValue.value.unit,
            decimalCount: selectedValue.value.decimalCount,
          }
        : defaultFormat;
    default:
      return exhaustiveCheck(propertyType, true);
  }
}

function getIsValid<TItem>(
  property: UsePropertiesSelectorProperty<TItem>,
  selectedValueItem: TItem | undefined,
  selectedProperties: PropertyValueSet.PropertyValueSet,
  comparer: PropertyValue.Comparer,
  getItemFilter: GetItemFilter<TItem>
): boolean {
  switch (getPropertyType(property.quantity)) {
    case "integer":
      return selectedValueItem
        ? PropertyFilter.isValid(selectedProperties, getItemFilter(selectedValueItem), comparer)
        : false;
    case "amount":
      return (
        property.validationFilter && PropertyFilter.isValid(selectedProperties, property.validationFilter, comparer)
      );
    default:
      return true;
  }
}

function getSelectorType<TItem>(
  property: UsePropertiesSelectorProperty<TItem>
): UsePropertiesSelectorPropertySelectorType<TItem> {
  if (property.quantity === "Text") {
    return "TextBox";
  } else if (property.quantity === "Discrete") {
    return "Discrete";
  } else {
    return "AmountField";
  }
}

function getPropertyType(quantity: string): PropertyValue.PropertyType {
  switch (quantity) {
    case "Text":
      return "text";
    case "Discrete":
      return "integer";
    default:
      return "amount";
  }
}

function shouldBeLocked<TItem>(
  selectedValueItem: TItem | undefined,
  productProperty: UsePropertiesSelectorProperty<TItem>,
  properties: PropertyValueSet.PropertyValueSet,
  comparer: PropertyValue.Comparer,
  getItemFilter: GetItemFilter<TItem>
): boolean {
  const singleValidValue = getSingleValidItemOrUndefined(productProperty, properties, comparer, getItemFilter);

  // getSingleValidValueOrUndefined only works on onChange.
  // Prevent locking when the sent in selectedValue isn't the singleValidValue
  if (singleValidValue && singleValidValue === selectedValueItem) {
    return true;
  }

  return false;
}

function handleChange<TItem>(
  externalOnChange: UsePropertiesSelectorOnPropertiesChanged,
  productProperties: ReadonlyArray<UsePropertiesSelectorProperty<TItem>>,
  autoSelectSingleValidValue: boolean,
  comparer: PropertyValue.Comparer,
  getItemValue: GetItemValue<TItem>,
  getItemFilter: GetItemFilter<TItem>
): (properties: PropertyValueSet.PropertyValueSet, propertyName: string) => void {
  return (properties: PropertyValueSet.PropertyValueSet, propertyName: string) => {
    if (!autoSelectSingleValidValue) {
      externalOnChange(properties, [propertyName]);
      return;
    }

    let lastProperties = properties;
    const changedProps = new Set([propertyName]);

    for (let i = 0; i < 4; i++) {
      for (const productProperty of productProperties) {
        if (productProperty.name === propertyName) {
          continue;
        }
        const singleItem = getSingleValidItemOrUndefined(productProperty, properties, comparer, getItemFilter);
        const singleItemValue = singleItem && getItemValue(singleItem);
        if (singleItem && singleItemValue) {
          properties = PropertyValueSet.set(productProperty.name, singleItemValue, properties);
          changedProps.add(productProperty.name);
        }
      }

      if (properties === lastProperties) {
        break;
      }

      lastProperties = properties;
    }

    externalOnChange(properties, Array.from(changedProps.keys()));
  };
}

function getSingleValidItemOrUndefined<TItem>(
  productProperty: UsePropertiesSelectorProperty<TItem>,
  properties: PropertyValueSet.PropertyValueSet,
  comparer: PropertyValue.Comparer,
  getItemFilter: GetItemFilter<TItem>
): TItem | undefined {
  if (productProperty.quantity === "Discrete") {
    const validPropertyValueItems: Array<TItem> = [];
    for (const productValueItem of productProperty.valueItems) {
      const isValid = PropertyFilter.isValid(properties, getItemFilter(productValueItem), comparer);

      if (isValid) {
        validPropertyValueItems.push(productValueItem);
      }
    }

    return validPropertyValueItems.length === 1 ? validPropertyValueItems[0] : undefined;
  }

  return undefined;
}

function getDistinctGroupNames<TItem>(
  productPropertiesArray: ReadonlyArray<SelectorRenderInfoInternal<TItem>>
): ReadonlyArray<string> {
  const groupNames: Array<string> = [];
  for (const property of productPropertiesArray) {
    // let groupName = property.groupName;
    if (isNullOrWhiteSpace(property.groupName)) {
      // groupName = "";
    }
    if (groupNames.indexOf(property.groupName) === -1) {
      groupNames.push(property.groupName);
    }
  }
  return groupNames;
}

function isNullOrWhiteSpace(str: string): boolean {
  return str === null || str === undefined || str.length < 1 || str.replace(/\s/g, "").length < 1;
}

function optionsWithDefaults<TItem>(
  params: UsePropertiesSelectorOptions<TItem>
): Required<UsePropertiesSelectorOptions<TItem>> {
  // Do destructoring and set defaults
  const {
    productProperties,
    selectedProperties,
    filterPrettyPrint = (propertyFilter: PropertyFilter.PropertyFilter) =>
      PropertyFiltering.filterPrettyPrintIndented(
        // PropertyFiltering.FilterPrettyPrintMessagesEnglish,
        PropertyFiltering.buildEnglishMessages(params.unitsFormat),
        2,
        " ",
        propertyFilter,
        params.unitsFormat,
        params.unitLookup
      ),

    showCodes = false,
    includeHiddenProperties = false,
    autoSelectSingleValidValue = true,
    lockSingleValidValue = false,
    onChange = (_a: PropertyValueSet.PropertyValueSet, _propertyName: ReadonlyArray<string>) => ({}),
    onPropertyFormatChanged = (_a: string, _b: Unit.Unit<unknown>, _c: number) => ({}),
    onPropertyFormatCleared = (_a: string) => ({}),

    valueMustBeNumericMessage = "value_must_be_numeric",
    valueIsRequiredMessage = "value_is_required",

    readOnlyProperties = [],
    optionalProperties = [],
    propertyFormats = {},

    inputDebounceTime = 350,

    unitsFormat,
    units,

    initiallyClosedGroups = [],

    unitLookup,
    comparer = PropertyValue.defaultComparer,
    sortValidFirst = false,
    getUndefinedValueItem,
    getItemValue,
    getItemFilter,
  } = params;

  return {
    productProperties,
    selectedProperties,
    filterPrettyPrint,
    showCodes,
    includeHiddenProperties,
    autoSelectSingleValidValue,
    lockSingleValidValue,
    onChange,
    onPropertyFormatChanged,
    onPropertyFormatCleared,
    valueMustBeNumericMessage,
    valueIsRequiredMessage,
    readOnlyProperties,
    optionalProperties,
    propertyFormats,
    inputDebounceTime,
    initiallyClosedGroups,
    unitsFormat,
    units,
    unitLookup,
    comparer,
    sortValidFirst,
    getUndefinedValueItem,
    getItemValue,
    getItemFilter,
  };
}
