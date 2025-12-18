<script setup>
import { computed, onMounted } from 'vue'
import { Line } from 'vue-chartjs'
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Filler,
} from 'chart.js'
import { useFxStore } from '@/stores/fx'
import { storeToRefs } from 'pinia'
import ApiSkeleton from '../ui/ApiSkeleton.vue'

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, Filler)

const fxStore = useFxStore()
const { fxList, loading, error } = storeToRefs(fxStore)

const baseCurrency = 'USD'

// Labels are all currencies except the base currency
const labels = computed(() => fxList.value.filter(c => c.value !== baseCurrency).map(c => c.value))

// Single dataset: USD value per currency
const chartData = computed(() => ({
    labels: labels.value,
    datasets: [
        {
            label: `1 ${baseCurrency} in other currencies`,
            data: labels.value.map(code => fxStore.getExchangeRate(baseCurrency, code)),
            borderColor: '#0d9488',
            backgroundColor: 'rgba(13,148,136,0.2)',
            tension: 0.3,
            pointRadius: 5,
            pointHoverRadius: 7,
            fill: true,
        },
    ],
}))

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: true,
            position: 'top',
        },
        tooltip: {
            callbacks: {
                label: function (ctx) {
                    return `${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(2)}`
                },
            },
        },
    },
    scales: {
        y: {
            beginAtZero: false,
            title: {
                display: true,
                text: 'Value in USD',
            },
        },
        x: {
            title: {
                display: true,
                text: 'Currencies',
            },
        },
    },
}

onMounted(() => {
    fxStore.fetchFx()
})
</script>

<template>
    <section class="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-md w-full ">
        <h2 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
            FX Rates vs {{ baseCurrency }}
        </h2>
        <ApiSkeleton :loading="loading" :error="error" :items="fxList">
            <template #default="{ items }">
                <div class="w-full h-125">
                    <Line :data="chartData" :options="chartOptions" class="w-full h-full" />
                </div>
            </template>
        </ApiSkeleton>

    </section>
</template>
