import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { tap, map, catchError, timeout } from 'rxjs/operators';
import { Inventory } from './inventory';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  inventoryList: Inventory[] = [];
  inventoryListChanged$: Observable<boolean>;
  inventoryListChangedSubject: Subject<boolean>;
  triggerError$: Observable<boolean>;
  triggerErrorSubject: Subject<boolean>;
  url = "http://localhost:8081/api/Inventory";

  constructor(private http: HttpClient) {
    this.inventoryListChangedSubject = new Subject<boolean>();
    this.inventoryListChanged$ = this.inventoryListChangedSubject.asObservable();
    this.triggerErrorSubject = new Subject<boolean>();
    this.triggerError$ = this.triggerErrorSubject.asObservable();
  }

  getInventoryList(): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(this.url).pipe(
      timeout(5000),
      map(data => data.map(item => {
        const fileUrl = item.file ? 'http://localhost:8081/uploads/' + item.file : '';
        return new Inventory(
          item._id,
          item.assetName,
          item.assetQuantity,
          item.serialNumber,
          item.purchaseDate,
          item.location,
          item.assetTag,
          item.picture,
          fileUrl
        );
      })),
      catchError(e => {
        this.triggerErrorSubject.next(true);
        throw e;
      })
    );
  }

  addInventory(formData: FormData): Observable<any> {
    return this.http.post(this.url, formData).pipe(
      timeout(5000),
      tap(() => this.inventoryListChangedSubject.next(true)),
      catchError(e => {
        this.triggerErrorSubject.next(true);
        throw e;
      })
    );
  }

  editInventory(id: string, formData: FormData): Observable<any> {
    return this.http.put(`${this.url}/${id}`, formData).pipe(
      timeout(5000),
      tap(() => this.inventoryListChangedSubject.next(true)),
      catchError(e => {
        this.triggerErrorSubject.next(true);
        throw e;
      })
    );
  }

  deleteInventory(inventory: Inventory): Observable<any> {
    const _id = inventory._id;
    const url = `${this.url}/${_id}`;

    return this.http.delete(url).pipe(
      timeout(5000),
      tap(() => this.inventoryListChangedSubject.next(true)),
      catchError(e => {
        this.triggerErrorSubject.next(true);
        throw e;
      })
    );
  }

  getFile(assetId: string): Observable<{ fileUrl: string }> {
    const fileUrlEndpoint = `${this.url}/${assetId}/file`;
    return this.http.get<{ fileUrl: string }>(fileUrlEndpoint).pipe(
      timeout(5000),
      catchError(e => {
        this.triggerErrorSubject.next(true);
        throw e;
      })
    );
  }
}