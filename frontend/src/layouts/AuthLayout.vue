<script setup>
const year = new Date().getFullYear()
</script>

<template>
    <main class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <section class="w-full max-w-lg bg-white dark:bg-gray-900
             rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800
             px-6 py-8 sm:px-8" role="region" aria-labelledby="auth-title">
            <!-- Brand -->
            <header class="mb-8 text-center">
                <h1 id="auth-title" class="text-3xl font-bold text-brand">
                    FlowPay
                </h1>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Cross-border payments made simple
                </p>
            </header>

            <!-- Content -->
            <div>
                <slot />
            </div>

            <!-- Footer -->
            <footer class="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
                © {{ year }} FlowPay
            </footer>
        </section>
    </main>
</template>
