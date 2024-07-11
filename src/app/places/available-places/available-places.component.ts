import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { map } from 'rxjs';

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
  private httpClient = inject(HttpClient);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.isFetching.set(true);
    const subscription = this.httpClient
      .get<{ places: Place[] }>('http://localhost:3000/places', {
        observe: 'body', //body par défaut // response pour tout le contenu de la réponse (headers, status, body...) // events permettra de check chaque étape de la requête 
      })
      .pipe(
        map((resData) => resData.places)
      )
      .subscribe({
        next: (places) => {
          console.log(places);
          this.places.set(places);
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
