import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CENTER_SIGNUP_ROUTE } from '../../core/config/public-links';

@Component({
  selector: 'app-public-shell',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './public-shell.html',
})
export class PublicShellComponent {
  protected readonly centerSignupRoute = CENTER_SIGNUP_ROUTE;
}
