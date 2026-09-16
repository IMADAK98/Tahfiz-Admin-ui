import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CENTER_SIGNUP_ROUTE } from '../../core/config/public-links';

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  templateUrl: './landing.html',
})
export class LandingComponent {
  protected readonly centerSignupRoute = CENTER_SIGNUP_ROUTE;
}
