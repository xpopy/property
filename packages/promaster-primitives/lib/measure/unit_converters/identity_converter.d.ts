import { UnitConverter } from "../unit_converter";
export interface IdentityConverter {
    readonly type: "identity";
}
export declare function createIdentityConverter(): IdentityConverter;
export declare function convert(value: number): number;
export declare function inverse(converter: IdentityConverter): UnitConverter;
