import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { catchError, map, throwError } from 'rxjs';

import { Place } from '../place.model';
import { PlacesComponent } from '../places.component';
import { PlacesContainerComponent } from '../places-container/places-container.component';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-available-places',
  standalone: true,
  templateUrl: './available-places.component.html',
  styleUrl: './available-places.component.css',
  imports: [PlacesComponent, PlacesContainerComponent],
})
export class AvailablePlacesComponent implements OnInit {
  places = signal<Place[] | undefined>(undefined);
  isFetching = signal<boolean>(false);
  errorMsg = signal<string | undefined>(undefined);
  private httpClient = inject(HttpClient);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.isFetching.set(true);
    const subscription = this.httpClient
      .get<{ places: Place[] }>('http://localhost:3000/places', {
        observe: 'body', //body par défaut // response pour tout le contenu de la réponse (headers, status, body...) // events permettra de check chaque étape de la requête 
      })
      .pipe(
        map((resData) => resData.places),
        catchError((error) => {
          console.log(error);
          return throwError(() => new Error('Something went wrong fetching the available places. Please try again later!'));
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

  onSelectPlace(selectedPlace: Place) {
    console.log('Selected place:', selectedPlace);
    this.httpClient.put('http://localhost:3000/user-places/', {
      placeId : selectedPlace.id
    })
    .subscribe({
      next: (resData) => {
        console.log('Successfully selected place:', resData);
      },
      error: (error) => {
        console.log('Error selecting place:', error);
    }});
  }
}
