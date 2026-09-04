import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PersonResponse } from '../../../core/models/person.model';
import { formatYearRange, personInitials } from '../../../core/utils/person.utils';

@Component({
  selector: 'app-person-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './person-card.component.html',
  styleUrl: './person-card.component.scss',
})
export class PersonCardComponent {
  readonly person = input.required<PersonResponse>();

  readonly initials = computed(() => {
    const p = this.person();
    return personInitials(p.lastName, p.firstName);
  });

  readonly workYears = computed(() => {
    const p = this.person();
    return formatYearRange(p.workStartYear, p.workEndYear);
  });
}
