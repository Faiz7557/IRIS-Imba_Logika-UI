# Audit tambahan setelah court v2

Seluruh hasil simulasi 30 ulangan. Planning quotas and bounds use V_proxy; evaluation uses perturbed V_true of same total, fixed r_true, and benefit(min(x,V_true),V_true,r_true). No refit; isolates need-proxy error. Excess planned quota is counted separately, not silently reallocated.

| Galat kebutuhan | KKT gain median | Proporsional gain median |
|---|---:|---:|
| galat lognormal sigma=0,25 | 6.092% | 6.147% |
| kebutuhan terpencil 25% lebih tinggi | 9.962% | 10.089% |
| kebutuhan terpencil 25% lebih rendah | 1.837% | 1.909% |
| galat berbeda gugus dan wilayah | 10.377% | 10.596% |

| Koreksi kebutuhan | Perpindahan kuota KKT | Perpindahan kuota proporsional |
|---|---:|---:|
| galat lognormal sigma=0,25 | 10.098% | 10.065% |
| kebutuhan terpencil 25% lebih tinggi | 4.708% | 4.675% |
| kebutuhan terpencil 25% lebih rendah | 5.158% | 5.140% |
| galat berbeda gugus dan wilayah | 11.826% | 11.813% |

Perpindahan kuota = setengah jumlah selisih absolut kuota / total kuota, jika V evaluasi diketahui lalu solver dijalankan ulang dengan rho tetap. Ini sensitivitas keputusan terhadap koreksi kebutuhan, bukan pelatihan ulang prediksi.

| Tahun transisi | KKT median gain | Proporsional median gain |
|---|---:|---:|
| 1 | 6.956% | 6.978% |
| 2 | 7.500% | 7.469% |
| 3 | 7.592% | 7.598% |
| 4 | 7.552% | 7.582% |
| 5 | 7.484% | 7.574% |

Kedua skema memakai α=0,20, β=0,95 dan batas turun 10% dari tahun sebelumnya, mulai dari merata, dengan pagu/biaya yang sama. Semua batas dan pagu diuji.

Interpretasi: sensitivitas ini memisahkan kesalahan ukuran kebutuhan dari prediksi laju. Ia tidak mengubah data BPS, tidak membuktikan galat proksi sebenarnya, tidak melatih ulang model dan tidak menggantikan validasi pilot. Keunggulan KKT tetap tidak diklaim universal. Lihat excess_capacity_pct untuk kuota yang melampaui kapasitas evaluasi dalam skenario salah ukur.