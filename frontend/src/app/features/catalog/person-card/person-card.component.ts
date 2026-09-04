import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PersonResponse } from '../../../core/models/person.model';

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
    return ((p.lastName?.[0] ?? '') + (p.firstName?.[0] ?? '')).toUpperCase();
  });

  readonly workYears = computed((): string | null => {
    const { workStartYear: start, workEndYear: end } = this.person();
    if (!start && !end) return null;
    if (start && end) return `${start} — ${end}`;
    if (start) return `${start} — қазірге дейін`;
    return `— ${end}`;
  });
}
