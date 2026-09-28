import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DepartmentService } from '../../core/services/department.service';
import { AuthService } from '../../core/services/auth.service';
import { Department } from '../../core/models/models';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './departments.component.html'
})
export class DepartmentsComponent implements OnInit {
  departments: Department[] = [];
  loading = true;
  error = '';
  success = '';

  showForm = false;
  editingId: string | null = null;
  form = { name: '', code: '', departmentType: 'Government' };

  constructor(private departmentService: DepartmentService, public auth: AuthService) {}

  ngOnInit(): void { this.load(); }

  load() {
    this.loading = true;
    this.departmentService.list().subscribe({
      next: (res) => { this.departments = res; this.loading = false; },
      error: (err) => { this.error = err?.error?.message || 'Failed to load departments'; this.loading = false; }
    });
  }

  openCreate() {
    this.editingId = null;
    this.form = { name: '', code: '', departmentType: 'Government' };
    this.showForm = true;
  }

  openEdit(d: Department) {
    this.editingId = d._id;
    this.form = { name: d.name, code: d.code, departmentType: d.departmentType };
    this.showForm = true;
  }

  submit() {
    this.error = ''; this.success = '';
    const action = this.editingId
      ? this.departmentService.update(this.editingId, this.form)
      : this.departmentService.create(this.form);

    action.subscribe({
      next: () => {
        this.success = this.editingId ? 'Department updated.' : 'Department created.';
        this.showForm = false;
        this.load();
      },
      error: (err) => { this.error = err?.error?.message || 'Save failed'; }
    });
  }

  remove(d: Department) {
    if (!confirm(`Delete department "${d.name}"?`)) return;
    this.departmentService.remove(d._id).subscribe({
      next: () => this.load(),
      error: (err) => { this.error = err?.error?.message || 'Delete failed'; }
    });
  }
}
