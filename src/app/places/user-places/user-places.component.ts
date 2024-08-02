import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';

import { PlacesContainerComponent } from '../places-container/places-container.component';
import { PlacesComponent } from '../places.component';
import { Place } from '../place.model';
import { HttpClient } from '@angular/common/http';
import { catchError, map, throwError } from 'rxjs';

@Component({
  selector: 'app-user-places',
  standalone: true,
  templateUrl: './user-places.component.html',
  styleUrl: './user-places.component.css',
  imports: [PlacesContainerComponent, PlacesComponent],
})
export class UserPlacesComponent implements OnInit {
  places = signal<Place[] | undefined>(undefined);
  isFetching = signal<boolean>(false);
  errorMsg = signal<string | undefined>(undefined);
  private httpClient = inject(HttpClient);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.isFetching.set(true);
    const subscription = this.httpClient
      .get<{ places: Place[] }>('http://localhost:3000/user-places', {
        observe: 'body', //body par défaut // response pour tout le contenu de la réponse (headers, status, body...) // events permettra de check chaque étape de la requête 
      })
      .pipe(
        map((resData) => resData.places),
        catchError((error) => {
          console.log(error);
          return throwError(() => new Error('Something went wrong fetching your favorites places. Please try again later!'));
        }))
      .subscribe({
        next: (places) => {
          console.log(places);
          this.places.set(places);
        },
        error: (error: Error) => {
          this.isFetching.set(false);
          this.errorMsg.set(error.message);
        },
        complete: () => {
          this.isFetching.set(false);
        }
      });

    this.destroyRef.onDestroy(() => {
      console.log('Destroying AvailablePlacesComponent');
      subscription.unsubscribe();
    });
  }
}
