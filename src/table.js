
import { create, getCoords, getSideByCoords } from './documentUtils';
import './styles/table.pcss';

const CSS = {
  table: 'tc-table',
  inputField: 'tc-table__inp',
  cell: 'tc-table__cell',
  wrapper: 'tc-table__wrap',
  area: 'tc-table__area',
  highlight: 'tc-table__highlight'
};

/**
 * Generates and manages _table contents.
 */
export class Table {
  /**
   * Creates
   *
   * @param {boolean} readOnly - read-only mode flag
   */
  constructor(readOnly) {
    this.readOnly = readOnly;
    this._numberOfColumns = 0;
    this._numberOfRows = 0;
    this._element = this._createTableWrapper();
    this._table = this._element.querySelector('table');
    this._selectedCell = null;

    this._attachEvents();
  }

  /**
   * returns selected/editable cell or null if row is not selected
   * @return {HTMLElement|null}
   */
  get selectedCell() {
    return this._selectedCell;
  }

  /**
   * sets a selected cell and highlights it
   * @param cell - new current cell
   */
  set selectedCell(cell) {
    if (this._selectedCell) {
      this._selectedCell.classList.remove(CSS.highlight);
    }

    this._selectedCell = cell;

    if (this._selectedCell) {
      this._selectedCell.classList.add(CSS.highlight);
    }
  }

  /**
   * returns current a row that contains current cell
   * or null if no cell selected
   * @returns {HTMLElement|null}
   */
  get selectedRow() {
    if (!this.selectedCell) return null;

    return this.selectedCell.closest('tr');
  }

  /**
   * Inserts column to the right from currently selected cell
   */
  insertColumnAfter() {
    this.insertColumn(1);
  }

  /**
   * Inserts column to the left from currently selected cell
   */
  insertColumnBefore() {
    this.insertColumn();
  }

  /**
   * Inserts new row below a current row
   */
  insertRowBefore() {
    this.insertRow();
  }

  /**
   * Inserts row above a current row
   */
  insertRowAfter() {
    this.insertRow(1);
  }

  /**
   * Insert a column into table relatively to a current cell
   * @param {number} direction - direction of insertion. 0 is insertion before, 1 is insertion after
    if (!this.readOnly) {
      this._hangEvents();
    }
  }

  /**
   * Add column in table on index place
   *
   * @param {number} index - number in the array of columns, where new column to insert,-1 if insert at the end
   */
  insertColumn(direction = 0) {
    direction = Math.min(Math.max(direction, 0), 1);

    const insertionIndex = this.selectedCell
      ? this.selectedCell.cellIndex + direction
      : 0;

    this._numberOfColumns++;
    /** Add cell in each row */
    const rows = this._table.rows;

    for (let i = 0; i < rows.length; i++) {
      const cell = rows[i].insertCell(insertionIndex);

      this._fillCell(cell);
    }
  };

  /**
   * Remove column that includes currently selected cell
   * Do nothing if there's no current cell
   */
  deleteColumn() {
    if (!this.selectedCell) return;

    const removalIndex = this.selectedCell.cellIndex;

    this._numberOfColumns--;
    /** Delete cell in each row */
    const rows = this._table.rows;

    for (let i = 0; i < rows.length; i++) {
      rows[i].deleteCell(removalIndex);
    }
  };

  /**
   * Insert a row into table relatively to a current cell
   * @param {number} direction - direction of insertion. 0 is insertion before, 1 is insertion after
   * @return {HTMLElement} row
   * Add row in table on index place
   *
   * @param {number} index - number in the array of columns, where new column to insert,-1 if insert at the end
   * @returns {HTMLElement} row
   */
  insertRow(direction = 0) {
    direction = Math.min(Math.max(direction, 0), 1);

    const insertionIndex = this.selectedRow
      ? this.selectedRow.rowIndex + direction
      : 0;

    const row = this._table.insertRow(insertionIndex);

    this._numberOfRows++;

    this._fillRow(row);

    return row;
  };

  /**
   * Remove row in table on index place
   * @param {number} index - number in the array of columns, where new column to insert,-1 if insert at the end
   */
  deleteRow(index = -1) {
    if (!this.selectedRow) return;

    const removalIndex = this.selectedRow.rowIndex;

    this._table.deleteRow(removalIndex);
    this._numberOfRows--;
  };

  /**
   * get html element of table
   *
   * @returns {HTMLElement}
   */
  get htmlElement() {
    return this._element;
  }

  /**
   * get real table tag
   *
   * @returns {HTMLElement}
   */
  get body() {
    return this._table;
  }

  /**
   * returns selected/editable cell
   *
   * @returns {HTMLElement}
   */
  get selectedCell() {
    return this._selectedCell;
  }

  /**
   * @private
   * @returns {HTMLElement} tbody - where rows will be
   */
  _createTableWrapper() {

    return create('div', [ CSS.wrapper ], null, [ create('table', [ CSS.table ]) ]);
  }

  /**
   * @private
   * @returns {HTMLElement} - the area
   */
  _createContenteditableArea() {

    return create('div', [ CSS.inputField ], { contenteditable: !this.readOnly });
  }

  /**
   * @private
   * @param {HTMLElement} cell - empty cell
   */
  _fillCell(cell) {
    cell.classList.add(CSS.cell);
    const content = this._createContenteditableArea();

    cell.appendChild(create('div', [ CSS.area ], null, [ content ]));
  }

  /**
   * @private
   * @param row = the empty row
   */
  _fillRow(row) {
    for (let i = 0; i < this._numberOfColumns; i++) {
      const cell = row.insertCell();

      this._fillCell(cell);
    }
  }

  /**
   * @private
   */
  _attachEvents() {
    this._table.addEventListener('focus', (event) => {
      this._focusEditField(event);
    }, true);

    this._table.addEventListener('keydown', (event) => {
      this._pressedEnterInEditField(event);
    });

    this._table.addEventListener('click', (event) => {
      this._clickedOnCell(event);
    });

    this.htmlElement.addEventListener('keydown', (event) => {
      this._containerKeydown(event);
    });
  }

  /**
   * @private
   * @param {FocusEvent} event
   */
  _focusEditField(event) {

    if (!event.target.classList.contains(CSS.inputField)) {
      return;
    }
    this._selectedCell = event.target.closest('.' + CSS.cell);
  }

  /**
   * @private
   * @param {FocusEvent} event
   */
  _blurEditField(event) {
    if (!event.target.classList.contains(CSS.inputField)) {
      return;
    }
    this._selectedCell = null;
  }

  /**
   * @private
   * @param {KeyboardEvent} event
   */
  _pressedEnterInEditField(event) {
    if (!event.target.classList.contains(CSS.inputField)) {
      return;
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
    }
  }

  /**
   * @private
   * @param {MouseEvent} event
   */
  _clickedOnCell(event) {
    if (!event.target.classList.contains(CSS.cell)) {
      return;
    }
    const content = event.target.querySelector('.' + CSS.inputField);

    content.focus();
  }

  /**
   * @private
   *
   * detects button presses when editing a table's content
   * @param {KeyboardEvent} event
   * @param {MouseEvent} event

   */
  _containerKeydown(event) {
    if (event.key === 'Enter' && event.ctrlKey) {
      this._containerEnterPressed(event);
    }
  }

  /**
   * @private
   *
   * if "Ctrl + Enter" is pressed then create new line under current and focus it
   * @param {KeyboardEvent} event
   */
  _containerEnterPressed(event) {
    const newRow = this.insertRow(1);

    newRow.cells[0].click();
    event.target.dispatchEvent(new CustomEvent('mouseInActivatingArea', {
      detail: {
        side: side,
      },
      bubbles: true,
    }));
  }
}
