import {IComponent} from "../../interfaces/iComponent";
import {Column} from "../../entities/column";
import {GridApi} from "../../gridApi";
import {FilterModel, IFilterComp, IFilterParams} from "../../interfaces/iFilter";

export interface FloatingFilterChange {
}

export interface IFloatingFilterParams {
    column: Column;
    filterParams: IFilterParams,
    onFloatingFilterChanged: (change: any) => boolean;
    currentParentModel: () => any;
    parentFilterInstance: ( callback: (filterInstance: IFilterComp)=>void ) => void;
    suppressFilterButton: boolean;
    debounceMs?: number;
    api: GridApi;
}

export interface IFloatingFilter {
    onParentModelChanged(parentModel: any): void;
}

export interface IFloatingFilterComp extends IFloatingFilter, IComponent<IFloatingFilterParams> {
}

export interface BaseFloatingFilterChange extends FloatingFilterChange {
    model: FilterModel;
    apply: boolean;
}