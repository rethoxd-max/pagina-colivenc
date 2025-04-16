import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Horario {
  categoria: string;
  horario: string;
  dias: string[];
}

@Component({
  selector: 'app-horarios-escuela',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './horarios-escuela.component.html',
  styleUrls: ['./horarios-escuela.component.css']
})
export class HorariosEscuelaComponent implements OnInit {
  horarios: Horario[] = [
    {
      categoria: 'Benjamín (2016-2017)',
      horario: '16:00 - 17:00',
      dias: ['Lunes', 'Miércoles']
    },
    {
      categoria: 'Alevín (2014-2015)',
      horario: '17:00 - 18:00',
      dias: ['Lunes', 'Jueves', 'Viernes']
    },
    {
      categoria: 'Infantil (2012-2013)',
      horario: '17:00 - 18:15',
      dias: ['Lunes', 'Miércoles', 'Jueves']
    },
    {
      categoria: 'Cadete (2010-2011)',
      horario: '17:00 - 18:30',
      dias: ['Martes', 'Jueves', 'Viernes']
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }
} 