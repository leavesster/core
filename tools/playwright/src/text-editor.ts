import { ElementHandle } from '@playwright/test';

import { isMacintosh, isWindows } from '@opensumi/ide-utils';

import { OpenSumiApp } from './app';
import { OpenSumiContextMenu } from './context-menu';
import { OpenSumiEditor } from './editor';
import { OpenSumiExplorerFileStatNode } from './explorer-view';

abstract class ViewsModel {
  protected viewElement: ElementHandle<SVGElement | HTMLElement> | null;
  async mount(v: ElementHandle<SVGElement | HTMLElement> | null): Promise<void> {
    if (!this.viewElement) {
      this.viewElement = v;
    }
  }
}

class GlyphMarginModel extends ViewsModel {
  async getElement() {
    const glyphMargin = await this.viewElement?.$('.glyph-margin');
    const parent = await glyphMargin?.getProperty('parentNode');
    return parent?.asElement();
  }

  async getOverlay(lineNumber: number) {
    const margin = await this.getElement();
    const overlay = await margin?.$(`.margin-view-overlays > div:nth-child(${lineNumber})`);
    return overlay;
  }

  async hasBreakpoint(node: ElementHandle<SVGElement | HTMLElement>): Promise<boolean> {
    return !!(await node.$('.sumi-debug-breakpoint'));
  }

  async hasTopStackFrame(node: ElementHandle<SVGElement | HTMLElement>): Promise<boolean> {
    return !!(await node.$('.sumi-debug-top-stack-frame'));
  }

  async hasTopStackFrameLine(node: ElementHandle<SVGElement | HTMLElement>): Promise<boolean> {
    return !!(await node.$('.sumi-debug-top-stack-frame-line'));
  }
}

class OverlaysModel extends ViewsModel {
  async getElement() {
    return await this.viewElement?.$('.view-overlays');
  }

  async getOverlay(lineNumber: number) {
    const element = await this.getElement();
    const overlay = await element?.$(`div:nth-child(${lineNumber})`);
    return overlay;
  }
}

export class OpenSumiTextEditor extends OpenSumiEditor {
  private glyphMarginModel: GlyphMarginModel;
  private overlaysModel: OverlaysModel;

  constructor(app: OpenSumiApp, filestatElement: OpenSumiExplorerFileStatNode) {
    super(app, filestatElement);
    this.glyphMarginModel = new GlyphMarginModel();
    this.overlaysModel = new OverlaysModel();
  }

  async getGlyphMarginModel() {
    const viewElement = await this.getViewElement();
    this.glyphMarginModel.mount(viewElement);
    return this.glyphMarginModel;
  }

  async getOverlaysModel() {
    const viewElement = await this.getViewElement();
    this.overlaysModel.mount(viewElement);
    return this.overlaysModel;
  }

  async openLineContextMenuByLineNumber(lineNumber: number) {
    const existingLine = await this.lineByLineNumber(lineNumber);
    if (!existingLine) {
      return;
    }
    return OpenSumiContextMenu.open(this.app, async () => existingLine);
  }

  async openGlyphMarginContextMenu() {
    const glyphMargin = await this.getGlyphMarginModel();
    const view = await glyphMargin.getElement();
    if (!view) {
      return;
    }
    return OpenSumiContextMenu.open(this.app, async () => view);
  }

  async openTabContextMenu() {
    const view = await this.getTab();
    if (!view) {
      return;
    }
    return OpenSumiContextMenu.open(this.app, async () => view);
  }

  async numberOfLines(): Promise<number | undefined> {
    await this.activate();
    const viewElement = await this.getViewElement();
    const lineElements = await viewElement?.$$('.view-lines .view-line');
    return lineElements?.length;
  }

  async textContentOfLineByLineNumber(lineNumber: number): Promise<string | undefined> {
    const lineElement = await this.lineByLineNumber(lineNumber);
    const content = await lineElement?.textContent();
    return content ? this.replaceEditorSymbolsWithSpace(content) : undefined;
  }

  async replaceLineWithLineNumber(text: string, lineNumber: number): Promise<void> {
    await this.selectLineWithLineNumber(lineNumber);
    await this.typeTextAndHitEnter(text);
  }

  protected async typeTextAndHitEnter(text: string): Promise<void> {
    await this.page.keyboard.type(text);
    await this.page.keyboard.press('Enter');
  }

  async selectLineWithLineNumber(lineNumber: number): Promise<ElementHandle<SVGElement | HTMLElement> | undefined> {
    await this.activate();
    const lineElement = await this.lineByLineNumber(lineNumber);
    await this.selectLine(lineElement);
    return lineElement;
  }

  async placeCursorInLineWithLineNumber(
    lineNumber: number,
  ): Promise<ElementHandle<SVGElement | HTMLElement> | undefined> {
    await this.activate();
    const lineElement = await this.lineByLineNumber(lineNumber);
    await this.placeCursorInLine(lineElement);
    return lineElement;
  }

  async placeCursorInLineWithPosition(
    lineNumber: number,
    columnNumber: number,
  ): Promise<ElementHandle<SVGElement | HTMLElement> | undefined> {
    await this.activate();
    const lineElement = await this.lineByLineNumber(lineNumber);
    await this.placeCursorInLine(lineElement);
    for (let i = 0; i < columnNumber; i++) {
      await this.page.keyboard.press('ArrowRight');
    }
    return lineElement;
  }

  async deleteLineByLineNumber(lineNumber: number): Promise<void> {
    await this.selectLineWithLineNumber(lineNumber);
    await this.page.keyboard.press('Backspace');
  }

  async lineByLineNumber(lineNumber: number): Promise<ElementHandle<SVGElement | HTMLElement> | undefined> {
    await this.activate();
    const viewElement = await this.getViewElement();
    const lines = await viewElement?.$$('.view-lines .view-line');
    if (!lines) {
      throw new Error(`Couldn't retrieve lines of text editor ${this.tabSelector}`);
    }

    const linesWithXCoordinates: {
      x: number;
      lineElement: ElementHandle<SVGElement | HTMLElement>;
    }[] = [];
    for (const lineElement of lines) {
      const box = await lineElement.boundingBox();
      linesWithXCoordinates.push({ x: box ? box.x : Number.MAX_VALUE, lineElement });
    }
    linesWithXCoordinates.sort((a, b) => a.x.toString().localeCompare(String(b.x)));
    return linesWithXCoordinates[lineNumber - 1].lineElement;
  }

  async textContentOfLineContainingText(text: string): Promise<string | undefined> {
    await this.activate();
    const lineElement = await this.lineContainingText(text);
    const content = await lineElement?.textContent();
    return content ? this.replaceEditorSymbolsWithSpace(content) : undefined;
  }

  async replaceLineContainingText(newText: string, oldText: string): Promise<void> {
    await this.selectLineContainingText(oldText);
    await this.typeTextAndHitEnter(newText);
  }

  async selectLineContainingText(text: string): Promise<ElementHandle<SVGElement | HTMLElement> | undefined> {
    await this.activate();
    const lineElement = await this.lineContainingText(text);
    await this.selectLine(lineElement);
    return lineElement;
  }

  async placeCursorInLineContainingText(text: string): Promise<ElementHandle<SVGElement | HTMLElement> | undefined> {
    await this.activate();
    const lineElement = await this.lineContainingText(text);
    await this.placeCursorInLine(lineElement);
    return lineElement;
  }

  async deleteLineContainingText(text: string): Promise<void> {
    await this.selectLineContainingText(text);
    await this.page.keyboard.press('Backspace');
  }

  async addTextToNewLineAfterLineContainingText(textContainedByExistingLine: string, newText: string): Promise<void> {
    const existingLine = await this.lineContainingText(textContainedByExistingLine);
    await this.placeCursorInLine(existingLine);
    await this.page.keyboard.press('End');
    await this.page.keyboard.press('Enter');
    await this.page.keyboard.type(newText);
  }

  async addTextToNewLineAfterLineByLineNumber(lineNumber: number, newText: string): Promise<void> {
    const existingLine = await this.lineByLineNumber(lineNumber);
    await this.placeCursorInLine(existingLine);
    await this.page.keyboard.press('End');
    await this.page.keyboard.press('Enter');
    await this.page.keyboard.type(newText);
  }

  async pasteContentAfterLineByLineNumber(lineNumber: number): Promise<void> {
    const modifier = isMacintosh ? 'Meta' : isWindows ? 'Ctrl' : 'Control';
    const existingLine = await this.lineByLineNumber(lineNumber);
    await this.placeCursorInLine(existingLine);
    await this.page.keyboard.press('End');
    await this.page.keyboard.press(`${modifier}+KeyV`);
  }

  protected async lineContainingText(text: string): Promise<ElementHandle<SVGElement | HTMLElement> | undefined> {
    const viewElement = await this.getViewElement();
    return viewElement?.waitForSelector(`.view-lines .view-line:has-text("${text}")`);
  }

  protected async selectLine(lineElement: ElementHandle<SVGElement | HTMLElement> | undefined): Promise<void> {
    await lineElement?.click({ clickCount: 3 });
  }

  protected async placeCursorInLine(lineElement: ElementHandle<SVGElement | HTMLElement> | undefined): Promise<void> {
    await lineElement?.click();
  }

  protected replaceEditorSymbolsWithSpace(content: string): string | Promise<string | undefined> {
    // [ ] &nbsp; => \u00a0
    // [·] &middot; => \u00b7
    return content.replace(/[\u00a0\u00b7]/g, ' ');
  }

  protected async selectedSuggestion(): Promise<ElementHandle<SVGElement | HTMLElement>> {
    return this.page.waitForSelector(this.viewSelector + ' .monaco-list-row.show-file-icons.focused');
  }

  async getSelectedSuggestionText(): Promise<string> {
    const suggestion = await this.selectedSuggestion();
    const text = await suggestion.textContent();
    if (text === null) {
      throw new Error('Text content could not be found');
    }
    return text;
  }

  async clearContent() {
    const line = await this.lineByLineNumber(1);
    await line?.click();
    const modifier = isMacintosh ? 'Meta' : isWindows ? 'Ctrl' : 'Control';
    await this.placeCursorInLine(line);
    await this.page.keyboard.press(`${modifier}+KeyA`);
    await this.page.keyboard.press('Delete');
  }
}
