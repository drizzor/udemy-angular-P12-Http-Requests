import { inject, Injectable, signal } from '@angular/core';

import { Place } from './place.model';
import { HttpClient } from '@angular/common/http';
import { catchError, map, tap, throwError } from 'rxjs';
import { ErrorService } from '../shared/error.service';

@Injectable({
  providedIn: 'root',
})
export class PlacesService {
  private errorService = inject(ErrorService);
  private httpClient = inject(HttpClient);
  private userPlaces = signal<Place[]>([]);

  loadedUserPlaces = this.userPlaces.asReadonly();

  loadAvailablePlaces() {
    return this.fetchPlaces('http://localhost:3000/places', 'Something went wrong fetching the available places. Please try again later!');
  }

  loadUserPlaces() {
    return this.fetchPlaces(
      'http://localhost:3000/user-places', 'Something went wrong fetching your favorite places. Please try again later!'
    ).pipe(tap({
      next: (userPlaces) => {
        this.userPlaces.set(userPlaces);
      }
    }));
  }

  addPlaceToUserPlaces(place: Place) {
    const prevPlaces = this.userPlaces(); // Je garde en mémoire les places déjà mises en favoris pour faire un rollback en cas d'erreur
    
    if(!prevPlaces.some((p) => p.id === place.id)) { // empeche de mettre 2 fois la même photo en favoris
      this.userPlaces.set([...prevPlaces, place]); // Mise à jour de la liste mise en favoris et donc ici ajout du nouveau click fav
    }

    return this.httpClient.put('http://localhost:3000/user-places/', {
      placeId : place.id
    }).pipe(
      catchError((error) => {
        this.userPlaces.set(prevPlaces); // Rollback en cas d'erreur
        this.errorService.showError('Failed to store selected place. Please try again later.');
        return throwError(() => new Error('Failed to store selected place. Please try again later.')); 
      })
    );
  }

  removeUserPlace(place: Place) {
    const prevPlaces = this.userPlaces();

    if(prevPlaces.some((p) => p.id === place.id)) { // empeche de purger userPlace si l'id envoyé n'est pas dans la liste des fav
      this.userPlaces.set(prevPlaces.filter(p => p.id !== place.id));
    }

    return this.httpClient.delete(`http://localhost:3000/user-places/${place.id}`)
    .pipe(
      catchError((error) => {
        this.userPlaces.set(prevPlaces);
        this.errorService.showError('Failed to remove selected place. Please try again later.');
        return throwError(() => new Error('Failed to remove selected place. Please try again later.'));
      })
    );
  }

  private fetchPlaces(url : string, errorMessage : string) {
    return this.httpClient
      .get<{ places: Place[] }>(url, {
        observe: 'body', //body par défaut // response pour tout le contenu de la réponse (headers, status, body...) // events permettra de check chaque étape de la requête 
      })
      .pipe(
        map((resData) => resData.places),
        catchError((error) => {
          console.log(error);
          return throwError(() => new Error(errorMessage));
        }))
  }
}
