import {IDoesFilterPassParams} from "../../../interfaces/iFilter";
import {RefSelector} from "../../../widgets/componentAnnotations";
import {_} from "../../../utils";
import {
    AbstractSimpleFilter,
    FilterPosition,
    IAbstractSimpleFilterParams,
    IAbstractSimpleModel
} from "../abstractSimpleFilter";

export interface TextFilterModel extends IAbstractSimpleModel {
    filter?: string;
}

export interface TextComparator {
    (filter: string, gridValue: any, filterText: string): boolean;
}

export interface TextFormatter {
    (from: string): string;
}

export interface ITextFilterParams extends IAbstractSimpleFilterParams {
    textCustomComparator?: TextComparator;
    caseSensitive?: boolean;
}

export class TextFilter extends AbstractSimpleFilter<TextFilterModel> {

    private static readonly FILTER_TYPE = 'text';

    public static DEFAULT_FILTER_OPTIONS = [AbstractSimpleFilter.CONTAINS, AbstractSimpleFilter.NOT_CONTAINS,
        AbstractSimpleFilter.EQUALS, AbstractSimpleFilter.NOT_EQUAL,
        AbstractSimpleFilter.STARTS_WITH, AbstractSimpleFilter.ENDS_WITH];

    static DEFAULT_FORMATTER: TextFormatter = (from: string) => {
        return from;
    };

    static DEFAULT_LOWERCASE_FORMATTER: TextFormatter = (from: string) => {
        if (from == null) { return null; }
        return from.toString().toLowerCase();
    };

    static DEFAULT_COMPARATOR: TextComparator = (filter: string, value: any, filterText: string) => {
        switch (filter) {
            case TextFilter.CONTAINS:
                return value.indexOf(filterText) >= 0;
            case TextFilter.NOT_CONTAINS:
                return value.indexOf(filterText) === -1;
            case TextFilter.EQUALS:
                return value === filterText;
            case TextFilter.NOT_EQUAL:
                return value != filterText;
            case TextFilter.STARTS_WITH:
                return value.indexOf(filterText) === 0;
            case TextFilter.ENDS_WITH:
                const index = value.lastIndexOf(filterText);
                return index >= 0 && index === (value.length - filterText.length);
            default:
                // should never happen
                console.warn('invalid filter type ' + filter);
                return false;
        }
    };

    @RefSelector('eValue1')
    private eValue1: HTMLInputElement;

    @RefSelector('eValue2')
    private eValue2: HTMLInputElement;

    private comparator: TextComparator;
    private formatter: TextFormatter;

    private textFilterParams: ITextFilterParams;

    private getValue(element: HTMLInputElement): string {
        let val = element.value;
        val = _.makeNull(val);
        if (val && val.trim() === '') {
            val = null;
        }
        if (val && !this.textFilterParams.caseSensitive) {
            val = val.toLowerCase();
        }
        return val;
    }

    private addValueChangedListeners(): void {
        const listener = this.onUiChangedListener.bind(this);
        this.addDestroyableEventListener(this.eValue1, 'input', listener);
        this.addDestroyableEventListener(this.eValue2, 'input', listener);
    }

    protected setParams(params: ITextFilterParams): void {
        super.setParams(params);

        this.textFilterParams = params;
        this.comparator = this.textFilterParams.textCustomComparator ? this.textFilterParams.textCustomComparator : TextFilter.DEFAULT_COMPARATOR;
        this.formatter =
            this.textFilterParams.textFormatter ? this.textFilterParams.textFormatter :
                this.textFilterParams.caseSensitive == true ? TextFilter.DEFAULT_FORMATTER :
                    TextFilter.DEFAULT_LOWERCASE_FORMATTER;

        this.addValueChangedListeners();
    }

    protected setConditionIntoUi(model: TextFilterModel, position: FilterPosition): void {
        const positionOne = position===FilterPosition.One;

        const eValue = positionOne ? this.eValue1 : this.eValue2;

        eValue.value = model ? model.filter : null;
    }

    protected createCondition(position: FilterPosition): TextFilterModel {

        const positionOne = position===FilterPosition.One;

        const type = positionOne ? this.getType1() : this.getType2();
        const eValue = positionOne ? this.eValue1 : this.eValue2;
        const value = this.getValue(eValue);

        const model: TextFilterModel =  {
            filterType: TextFilter.FILTER_TYPE,
            type: type
        };
        if (!this.doesFilterHaveHiddenInput(type)) {
            model.filter = value;
        }
        return model;
    }

    protected getFilterType(): string {
        return TextFilter.FILTER_TYPE;
    }

    protected areSimpleModelsEqual(aSimple: TextFilterModel, bSimple: TextFilterModel): boolean {
        return aSimple.filter === bSimple.filter && aSimple.type === bSimple.type;
    }

    protected resetUiToDefaults(): void {
        super.resetUiToDefaults();

        this.eValue1.value = null;
        this.eValue2.value = null;
    }

    protected setFloatingFilter(model: TextFilterModel): void {
        if (model) {
            this.eValue1.value = model.filter;
        } else {
            this.eValue1.value = null;
        }
    }

    public getDefaultFilterOptions(): string[] {
        return TextFilter.DEFAULT_FILTER_OPTIONS;
    }

    protected createValueTemplate(position: FilterPosition): string {

        const pos = position===FilterPosition.One ? '1' : '2';
        const translate = this.gridOptionsWrapper.getLocaleTextFunc();

        return `<div class="ag-filter-body" ref="eCondition${pos}Body">
            <div class="ag-input-text-wrapper">
                <input class="ag-filter-filter" ref="eValue${pos}" type="text" placeholder="${translate('filterOoo', 'Filter...')}"/>
            </div>
        </div>`;
    }

    protected updateUiVisibility(): void {
        super.updateUiVisibility();

        const show = (type: string, eValue: HTMLElement) => {
            const showValue = !this.doesFilterHaveHiddenInput(type) && type !== AbstractSimpleFilter.EMPTY;
            _.setVisible(eValue, showValue);
        };

        show(this.getType1(), this.eValue1);
        show(this.getType2(), this.eValue2);
    }

    public afterGuiAttached() {
        this.eValue1.focus();
    }

    protected isFilterUiComplete(position: FilterPosition): boolean {
        const positionOne = position===FilterPosition.One;

        const option = positionOne ? this.getType1() : this.getType2();
        const eFilterValue = positionOne ? this.eValue1 : this.eValue2;

        const value = this.getValue(eFilterValue);
        if (this.doesFilterHaveHiddenInput(option)) {
            return true;
        }
        return value != null;
    }

    public individualFilterPasses(params: IDoesFilterPassParams, filterModel: TextFilterModel): boolean {

        const filterText:string =  filterModel.filter;
        const filterOption:string = filterModel.type;
        const cellValue = this.textFilterParams.valueGetter(params.node);
        const formattedCellValue = this.formatter(filterText);

        const customFilterOption = this.optionsFactory.getCustomOption(filterOption);
        if (customFilterOption) {
            // only execute the custom filter if a value exists or a value isn't required, i.e. input is hidden
            if (filterText != null || customFilterOption.hideFilterInput) {
                return customFilterOption.test(filterText, formattedCellValue);
            }
        }

        if (cellValue == null || cellValue === undefined) {
            return filterOption === AbstractSimpleFilter.NOT_EQUAL || filterOption === AbstractSimpleFilter.NOT_CONTAINS;
        }

        const valueFormatted: string = this.formatter(cellValue);
        return this.comparator(filterOption, valueFormatted, formattedCellValue);
    }

}