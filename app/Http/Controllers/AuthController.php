<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'error' => 'invalid_credentials',
                'error_description' => 'Invalid login credentials'
            ], 400);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        // Determine role and store
        $role = null;
        $assigned_store_id = null;

        // Check if user is an owner of any store
        $isOwner = \App\Models\Store::where('owner_user_id', $user->id)->exists();
        if ($isOwner) {
            $role = 'owner';
        } else {
            // Check if user is staff
            $staff = \App\Models\StaffAccount::where('user_id', $user->id)
                ->orWhere('email', $user->email) // fallback
                ->first();
            if ($staff) {
                $role = $staff->role;
                $assigned_store_id = $staff->store_id;
            }
        }

        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'user' => array_merge($user->toArray(), [
                'role' => $role,
                'assigned_store_id' => $assigned_store_id
            ])
        ]);
    }

    public function signup(Request $request)
    {
        $request->validate([
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
        ]);

        $data = $request->all();
        $options = $data['options']['data'] ?? [];

        $user = User::create([
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'name' => $options['full_name'] ?? '',
            'full_name' => $options['full_name'] ?? '',
            'phone' => $options['phone'] ?? '',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'user' => array_merge($user->toArray(), [
                'role' => 'owner', // signups are always owners initially
                'assigned_store_id' => null
            ])
        ]);
    }

    public function signupWithStore(Request $request)
    {
        $request->validate([
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
            'storeName' => 'required',
        ]);

        $user = User::create([
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'name' => $request->fullName ?? '',
            'full_name' => $request->fullName ?? '',
            'phone' => $request->phone ?? '',
        ]);

        $store = \App\Models\Store::create([
            'owner_user_id' => $user->id,
            'store_name' => $request->storeName,
            'phone' => $request->storePhone ?? '',
            'location' => $request->storeLocation ?? '',
            'currency' => $request->currency ?? 'KSh',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'user' => array_merge($user->toArray(), [
                'role' => 'owner',
                'assigned_store_id' => null
            ]),
            'store' => $store
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out'], 200);
    }

    public function createStaff(Request $request)
    {
        $request->validate([
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
            'full_name' => 'required',
            'store_id' => 'required',
            'role' => 'required',
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request) {
            // Create the user
            $user = User::create([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'name' => $request->full_name,
                'full_name' => $request->full_name,
                'phone' => $request->phone ?? '',
            ]);

            // Create the staff account
            $staff = \App\Models\StaffAccount::create([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'user_id' => $user->id,
                'store_id' => $request->store_id,
                'full_name' => $request->full_name,
                'email' => $request->email,
                'phone' => $request->phone ?? '',
                'role' => $request->role,
                'is_active' => true,
            ]);

            return response()->json(['user' => $user, 'staff' => $staff], 201);
        });
    }

    public function updateStaffPassword(Request $request)
    {
        $request->validate([
            'staff_id' => 'required',
            'password' => 'required|min:6',
        ]);

        $staff = \App\Models\StaffAccount::find($request->staff_id);
        if (!$staff) return response()->json(['message' => 'Staff not found'], 404);

        $user = User::where('email', $staff->email)->orWhere('id', $staff->user_id)->first();
        
        if ($user) {
            $user->password = Hash::make($request->password);
            $user->save();
            return response()->json(['message' => 'Password updated'], 200);
        }

        return response()->json(['message' => 'User not found'], 404);
    }
}
