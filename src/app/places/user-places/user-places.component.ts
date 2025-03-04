import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';

import { PlacesContainerComponent } from '../places-container/places-container.component';
import { PlacesComponent } from '../places.component';
import { Place } from '../place.model';
import { PlacesService } from '../places.service';

@Component({
  selector: 'app-user-places',
  standalone: true,
  templateUrl: './user-places.component.html',
  styleUrl: './user-places.component.css',
  imports: [PlacesContainerComponent, PlacesComponent],
})
export class UserPlacesComponent implements OnInit {
  isFetching = signal<boolean>(false);
  errorMsg = signal<string | undefined>(undefined);
  private placesService = inject(PlacesService);
  private destroyRef = inject(DestroyRef);
  places = this.placesService.loadedUserPlaces;

  ngOnInit(): void {
    this.isFetching.set(true);
    const subscription = this.placesService.loadUserPlaces()
      .subscribe({
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

  onSelectPlace(place: Place) {
    // console.log('Selected place (DEL):', place);
    const subscription = this.placesService.removeUserPlace(place)
    .subscribe(/*{
      next: (resData) => {
        console.log('Successfully removed place:', resData);
      },
      error: (error) => {
        console.log('Error removing place:', error);
      }
    }*/);

    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
    });
  }
}
