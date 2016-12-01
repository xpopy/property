import {ParagraphBuilder} from "./paragraph-builder";
import {FieldType} from "../model/enums/field-type";
import {TextProperties} from "../model/properties/text-properties";
import {Guid, AbstractDoc} from "../model/abstract-doc";
import {TableCellBuilder} from "./table-cell-builder";
import {TableBuilder} from "./table-builder";
import {MasterPage} from "../model/page/master-page";
import {NumberingDefinition} from "../model/numberings/numbering-definition";
import {Numbering} from "../model/numberings/numbering";
import {Style} from "../model/styles/style";
import {AbstractImage} from "../../abstract-image/abstract-image";

export interface DocumentBuilder {
  Build(): AbstractDoc ;

  // Get a name that is local to the report, to use with eg. styles
  GetLocalName(reportType: string, name: string): string ;

  AddImageResource(id: Guid, abstractImage: AbstractImage, renderScale: number): void ;
  SetStyleName(name: string, style: Style): void ;

  SetNumbering(numberingId: string, numbering: Numbering): void ;
  SetNumberingDefinition(numberingDefinitionId: string, definition: NumberingDefinition): void ;

  BeginSection(page: MasterPage): void ;
  EndSection(): void ;

  BeginParagraph(): ParagraphBuilder ;
  BeginParagraph(styleBasedOn: string): ParagraphBuilder ;
  EndParagraph(): void ;

  BeginTable(columns: number[], keepTogether: boolean): TableBuilder ;
  EndTable(): void ;
  BeginTableRow(height: number): void ;
  EndTableRow(): void ;
  BeginTableCell(columnSpan: number): TableCellBuilder ;
  EndTableCell(): void ;

  BeginKeepTogether(): void ;
  EndKeepTogether(): void ;

  InsertImage(imageResourceId: Guid, width: number, height: number): void ;
  InsertImageWithResource(imageResourceId: Guid, abstractImage: AbstractImage, width: number, height: number, renderScale: number): void ;

  InsertTextRun(text: string): void ;
  InsertTextRun(text: string, textProperties: TextProperties): void ;
  InsertTextRun(text: string, styleName: string): void ;

  InsertField(type: FieldType, textProperties: TextProperties): void ;
  InsertField(type: FieldType, styleName: string): void ;
}

