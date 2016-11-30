import * as React from "react";
import {Unit, PropertyValueSet, PropertyValue, PropertyFilter, Quantity} from "@promaster/promaster-primitives";
import {PropertySelectorComponentProps} from "./default-property-selector-component";
import {PropertyLabelComponentProps} from "./default-property-label-component";

export type AmountFormat = {unit: Unit.Unit<any>, decimalCount: number};
export type PropertySelectionOnChange = (properties: PropertyValueSet.PropertyValueSet) => void;
export type OnPropertyFormatChanged = (propertyName: string, unit: Unit.Unit<any>, decimalCount: number) => void

export type TranslatePropertyName = (propertyName: string) => string;
export type TranslatePropertyValue = (propertyName: string, value: number | undefined) => string;
export type TranslateNotNumericMessage = () => string;
export type TranslateValueIsRequiredMessage = () => string;

export type TranslatePropertyLabelHover = (propertyName: string) => string;
export type TranslateGroupName = (groupName: string) => string;
export type OnToggleGroupClosed = (groupName: string) => void;

export type ReactComponent<T> = React.ComponentClass<T> | React.StatelessComponent<T>;

// Defines information to render one selector
export interface PropertySelectorRenderInfo {

	// This is information that the layout component can use
	readonly sortNo: number,
	readonly groupName: string,
	readonly propertyName: string,

	// This flag tells if the selector currently holds a valid selection
	readonly isValid: boolean,

	// If includeHiddenProperties was specified, the selector may have been rendered even if it is supposed to be hidden
	// This flag tells if is was supposed to be hidden
	readonly isHidden: boolean,

	// A default label is provided here that adheres to showCodes,
	// the layout component can of course choose not to use this label
	readonly label: string,

  // Props that are used by the components that render the actual property selector and it's label
  readonly selectorComponentProps: PropertySelectorComponentProps,
  readonly labelComponentProps: PropertyLabelComponentProps,

}

export interface Property {
	readonly sortNo: number,
	readonly name: string,
	readonly group: string,
	readonly quantity: Quantity.Quantity,
	readonly validationFilter: PropertyFilter.PropertyFilter,
	readonly visibilityFilter: PropertyFilter.PropertyFilter,
	readonly valueItems: Array<PropertyValueItem>,
}

export interface PropertyValueItem {
	readonly value: PropertyValue.PropertyValue,
	readonly sortNo: number,
	readonly validationFilter: PropertyFilter.PropertyFilter,
  readonly image?: string,
}


