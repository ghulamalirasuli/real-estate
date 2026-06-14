<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        Permission::create(['name' => 'manage properties']);
        Permission::create(['name' => 'manage users']);
        Permission::create(['name' => 'approve properties']);

        // Create roles and assign permissions
        $adminRole = Role::create(['name' => 'admin']);
        $adminRole->givePermissionTo(Permission::all());

        $agentRole = Role::create(['name' => 'agent']);
        $agentRole->givePermissionTo('manage properties');

        $userRole = Role::create(['name' => 'user']);

        // Create admin user
        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@realestate.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);
        $admin->assignRole('admin');

        // Create agent user
        $agent = User::create([
            'name' => 'Agent User',
            'email' => 'agent@realestate.com',
            'password' => Hash::make('password'),
            'role' => 'agent',
        ]);
        $agent->assignRole('agent');

        // Create regular user
        $user = User::create([
            'name' => 'Test User',
            'email' => 'user@realestate.com',
            'password' => Hash::make('password'),
            'role' => 'user',
        ]);
        $user->assignRole('user');
    }
}
